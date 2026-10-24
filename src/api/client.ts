import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { axiosInstance } from "@kubb/plugin-client/clients/axios";
import { tryGetAppConfig } from "../lib/appConfig";

const ENV_BASE_URL: string | undefined = import.meta.env.VITE_API_BASE_URL;
if (!ENV_BASE_URL) {
  throw new Error("Aplicação sem VITE_API_BASE_URL no build. Contacte o administrador.");
}
const BASE_URL: string = ENV_BASE_URL;

// ── Token de acesso: SÓ em memória (B59 F2) ───────────────────────────────────
// Nunca em localStorage/sessionStorage: um XSS lia-o e levava a sessão. Ao recarregar a
// página, o token renova-se pelo cookie de refresh httpOnly (`restoreSession`).
// Limpeza do valor que versões antigas da app deixaram no dispositivo.
try {
  localStorage.removeItem("gymnoprado_token");
} catch {
  /* sem localStorage — nada a limpar */
}
let accessToken: string | null = null;

export const getToken = () => accessToken;
export function setToken(token: string | null) {
  accessToken = token;
}

// Callback invocado quando a sessão expira de vez (refresh falhou).
let onAuthExpired: (() => void) | null = null;
export const setOnAuthExpired = (fn: () => void) => {
  onAuthExpired = fn;
};

// Callback invocado quando a API responde 403 MEMBERSHIP_BLOCKED (GY-26): a sessão continua boa.
let onMembershipBlocked: (() => void) | null = null;
export const setOnMembershipBlocked = (fn: () => void) => {
  onMembershipBlocked = fn;
};

// ── Configura a instância axios partilhada que o Kubb usa nos hooks gerados ─────
axiosInstance.defaults.withCredentials = true;

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = BASE_URL; // honra o env em produção (os hooks têm baseURL hardcoded)
  // Site token do tenant — exigido pelos endpoints públicos (ex: /websites/content).
  // Lê de appConfig (carregada no arranque).
  const appConfig = tryGetAppConfig();
  if (appConfig?.siteToken) config.headers.set("X-Site-Token", appConfig.siteToken);
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

/** Token CSRF (double-submit: cookie + cabeçalho). Lança em erro de rede — o chamador decide se é transitório. */
export async function getCsrfToken(): Promise<string | null> {
  const res = await axios.get(`${BASE_URL}/csrf-token`, { withCredentials: true });
  return res.data?.csrfToken ?? null;
}

/**
 * Renova o token de acesso pelo cookie de refresh httpOnly (a API roda o cookie).
 * Lança o erro do axios: 401 = sem sessão/expirada; sem resposta/5xx = transitório.
 */
export async function refreshSession(): Promise<string> {
  const csrf = await getCsrfToken();
  const res = await axios.post(
    `${BASE_URL}/websites/customers/authentication/refresh`,
    {},
    { withCredentials: true, headers: csrf ? { "x-csrf-token": csrf } : {} },
  );
  const token: string | undefined = res.data?.accessToken;
  if (!token) throw new Error("Resposta de refresh sem accessToken");
  setToken(token);
  return token;
}

/** Renova o token. 'network' = sem rede (a sessão pode estar boa: não a terminar); null = recusada (sessão acabou). */
async function refreshAccessToken(): Promise<string | null | "network"> {
  try {
    return await refreshSession();
  } catch (e) {
    return isNetworkApiError(e) ? "network" : null;
  }
}

/** Termina a sessão no servidor (revoga o refresh token e limpa o cookie). Precisa de CSRF. */
export async function serverLogout(): Promise<void> {
  const csrf = await getCsrfToken();
  await axios.post(
    `${BASE_URL}/websites/customers/authentication/logout`,
    {},
    { withCredentials: true, headers: csrf ? { "x-csrf-token": csrf } : {} },
  );
}

let refreshing: Promise<string | null | "network"> | null = null;

axiosInstance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes("/authentication/");

    // GY-26: mensalidade bloqueada. NÃO é erro de sessão: sem refresh, sem despromover.
    if (isMembershipBlockedError(error)) onMembershipBlocked?.();

    if (status === 401 && original && !original._retry && !isAuthCall && accessToken) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken === "network") return Promise.reject(error); // sem rede: mantém a sessão; o chamador trata o 401
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return axiosInstance(original);
      }
      setToken(null);
      onAuthExpired?.();
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || fallback;
  }
  return fallback;
}

/**
 * Erro TRANSITÓRIO (vale a pena reter/reenviar): sem resposta do servidor
 * (offline/timeout/DNS), 5xx, 429 (rate limit) ou 408 (request timeout).
 * Um 4xx é definitivo — reenviar dá o mesmo resultado. Usado pela fila offline
 * de logs e pelo restauro de sessão.
 */
export function isTransientApiError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (!err.response) return true; // rede/timeout — nunca chegou ao servidor
  const status = err.response.status;
  return status >= 500 || status === 429 || status === 408;
}

/** GY-26: 403 com `code: "MEMBERSHIP_BLOCKED"` — mensalidade bloqueada; a sessão está boa. */
export function isMembershipBlockedError(err: unknown): boolean {
  if (!axios.isAxiosError(err) || err.response?.status !== 403) return false;
  const data = err.response.data as { code?: string } | undefined;
  return data?.code === "MEMBERSHIP_BLOCKED";
}

/** 401 (sessão por renovar) ou bloqueio de mensalidade: o registo de treino não se perde (fila). */
export function isSessionPendingError(err: unknown): boolean {
  return (
    isTransientApiError(err) ||
    isMembershipBlockedError(err) ||
    (axios.isAxiosError(err) && err.response?.status === 401)
  );
}

/** Falha de REDE pura: o pedido nunca obteve resposta (offline/DNS/timeout). Não inclui 5xx. */
export function isNetworkApiError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

/** Erro de AUTENTICAÇÃO definitivo (401/403) — o único que justifica despromover a sessão. Exclui o 403 MEMBERSHIP_BLOCKED. */
export function isAuthApiError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (isMembershipBlockedError(err)) return false;
  const s = err.response?.status;
  return s === 401 || s === 403;
}

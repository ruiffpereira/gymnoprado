import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { axiosInstance } from "@kubb/plugin-client/clients/axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
const TOKEN_KEY = "gymnoprado_token";

// ── Token store (memória + localStorage) ──────────────────────────────────────
let accessToken: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const getToken = () => accessToken;
export function setToken(token: string | null) {
  accessToken = token;
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Callback invocado quando a sessão expira de vez (refresh falhou).
let onAuthExpired: (() => void) | null = null;
export const setOnAuthExpired = (fn: () => void) => {
  onAuthExpired = fn;
};

// ── Configura a instância axios partilhada que o Kubb usa nos hooks gerados ─────
axiosInstance.defaults.withCredentials = true;

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = BASE_URL; // honra o env em produção (os hooks têm baseURL hardcoded)
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

async function getCsrfToken(): Promise<string | null> {
  try {
    const res = await axios.get(`${BASE_URL}/csrf-token`, { withCredentials: true });
    return res.data?.csrfToken ?? null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const csrf = await getCsrfToken();
  try {
    const res = await axios.post(
      `${BASE_URL}/websites/customers/autentication/refresh`,
      {},
      { withCredentials: true, headers: csrf ? { "x-csrf-token": csrf } : {} },
    );
    const token = res.data?.accessToken ?? null;
    if (token) setToken(token);
    return token;
  } catch {
    return null;
  }
}

let refreshing: Promise<string | null> | null = null;

axiosInstance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes("/autentication/");

    if (status === 401 && original && !original._retry && !isAuthCall && accessToken) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
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

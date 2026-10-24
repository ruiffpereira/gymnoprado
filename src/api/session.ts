// Orquestração de autenticação por cima dos hooks gerados pelo Kubb.
import { postWebsitesCustomersAuthenticationLogin } from "../gen/hooks/usePostWebsitesCustomersAuthenticationLogin";
import { postWebsitesCustomersAuthenticationRegister } from "../gen/hooks/usePostWebsitesCustomersAuthenticationRegister";
import { postWebsitesCustomersAuthenticationForgotPassword } from "../gen/hooks/usePostWebsitesCustomersAuthenticationForgotPassword";
import { postWebsitesCustomersAuthenticationResetPassword } from "../gen/hooks/usePostWebsitesCustomersAuthenticationResetPassword";
import { getWebsitesGymMe } from "../gen/hooks/useGetWebsitesGymMe";
import { setToken, serverLogout } from "./client";
import { unsubscribeFromPush } from "../lib/push";
import { purgeUserData } from "../lib/purge";

export async function login(email: string, password: string) {
  const res = await postWebsitesCustomersAuthenticationLogin({
    provider: "credentials",
    email,
    password,
  });
  if (res.accessToken) setToken(res.accessToken);
  return res;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  contact: string;
}

/** Regista um novo cliente e autentica-o de seguida (o registo não devolve token). */
export async function register(data: RegisterData) {
  await postWebsitesCustomersAuthenticationRegister(data);
  return login(data.email, data.password);
}

/**
 * Termina a sessão. Primeiro apaga a subscrição push deste dispositivo (no browser e na API —
 * precisa do token, por isso vem antes), depois revoga o refresh token no servidor. Cada passo
 * é best-effort: a sessão local fecha-se sempre.
 */
export async function logout() {
  await Promise.race([unsubscribeFromPush(), new Promise<void>((r) => setTimeout(r, 4000))]).catch(() => undefined);
  try {
    await serverLogout();
  } catch {
    // limpamos a sessão de qualquer forma
  }
  setToken(null);
  // Nada do sócio anterior fica em cache (queries + cache `gym-api` do service worker) para o próximo a abrir a app.
  await purgeUserData();
}

export async function forgotPassword(email: string) {
  await postWebsitesCustomersAuthenticationForgotPassword({ email });
}

export async function resetPassword(token: string, newPassword: string) {
  await postWebsitesCustomersAuthenticationResetPassword({ token, newPassword });
}

export const fetchProfile = () => getWebsitesGymMe();

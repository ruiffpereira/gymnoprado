// Orquestração de autenticação por cima dos hooks gerados pelo Kubb.
import { postWebsitesCustomersAuthenticationLogin } from "../gen/hooks/usePostWebsitesCustomersAuthenticationLogin";
import { postWebsitesCustomersAuthenticationRegister } from "../gen/hooks/usePostWebsitesCustomersAuthenticationRegister";
import { postWebsitesCustomersAuthenticationLogout } from "../gen/hooks/usePostWebsitesCustomersAuthenticationLogout";
import { postWebsitesCustomersAuthenticationForgotPassword } from "../gen/hooks/usePostWebsitesCustomersAuthenticationForgotPassword";
import { postWebsitesCustomersAuthenticationResetPassword } from "../gen/hooks/usePostWebsitesCustomersAuthenticationResetPassword";
import { getWebsitesGymMe } from "../gen/hooks/useGetWebsitesGymMe";
import { setToken } from "./client";
import { getAppConfig } from "../lib/appConfig";

export async function login(email: string, password: string) {
  const { userId } = getAppConfig();
  const res = await postWebsitesCustomersAuthenticationLogin({
    userId,
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
  const { userId } = getAppConfig();
  await postWebsitesCustomersAuthenticationRegister({ userId, ...data });
  return login(data.email, data.password);
}

export async function logout() {
  try {
    await postWebsitesCustomersAuthenticationLogout();
  } catch {
    // limpamos a sessão de qualquer forma
  }
  setToken(null);
}

export async function forgotPassword(email: string) {
  const { userId } = getAppConfig();
  await postWebsitesCustomersAuthenticationForgotPassword({ userId, email });
}

export async function resetPassword(token: string, newPassword: string) {
  await postWebsitesCustomersAuthenticationResetPassword({ token, newPassword });
}

export const fetchProfile = () => getWebsitesGymMe();

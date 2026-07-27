// Orquestração de autenticação por cima dos hooks gerados pelo Kubb.
import { postWebsitesCustomersAutenticationLogin } from "../gen/hooks/usePostWebsitesCustomersAutenticationLogin";
import { postWebsitesCustomersAutenticationRegister } from "../gen/hooks/usePostWebsitesCustomersAutenticationRegister";
import { postWebsitesCustomersAutenticationLogout } from "../gen/hooks/usePostWebsitesCustomersAutenticationLogout";
import { postWebsitesCustomersAutenticationForgotPassword } from "../gen/hooks/usePostWebsitesCustomersAutenticationForgotPassword";
import { postWebsitesCustomersAutenticationResetPassword } from "../gen/hooks/usePostWebsitesCustomersAutenticationResetPassword";
import { getWebsitesGymMe } from "../gen/hooks/useGetWebsitesGymMe";
import { setToken } from "./client";
import { getAppConfig } from "../lib/appConfig";

export async function login(email: string, password: string) {
  const { userId } = getAppConfig();
  const res = await postWebsitesCustomersAutenticationLogin({
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
  await postWebsitesCustomersAutenticationRegister({ userId, ...data });
  return login(data.email, data.password);
}

export async function logout() {
  try {
    await postWebsitesCustomersAutenticationLogout();
  } catch {
    // limpamos a sessão de qualquer forma
  }
  setToken(null);
}

export async function forgotPassword(email: string) {
  const { userId } = getAppConfig();
  await postWebsitesCustomersAutenticationForgotPassword({ userId, email });
}

export async function resetPassword(token: string, newPassword: string) {
  await postWebsitesCustomersAutenticationResetPassword({ token, newPassword });
}

export const fetchProfile = () => getWebsitesGymMe();

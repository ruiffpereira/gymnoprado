import { queryClient } from "./queryClient";

/** Nome da cache do service worker com as respostas autenticadas de `/api/websites/gym` (ver vite.config.ts). */
export const GYM_API_CACHE = "gym-api";

/**
 * Apaga os dados do sócio guardados no dispositivo: cache de queries e a cache `gym-api` do service worker.
 * Num telemóvel partilhado, quem abre a app a seguir não pode ver (nem offline) os dados do anterior.
 * Best-effort: sem Cache Storage (ou a falhar) nunca bloqueia a saída da conta.
 */
export async function purgeUserData(): Promise<void> {
  queryClient.clear();
  try {
    if (typeof caches !== "undefined") await caches.delete(GYM_API_CACHE);
  } catch {
    /* sem Cache Storage — nada a apagar */
  }
}

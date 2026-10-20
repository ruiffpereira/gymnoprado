/**
 * Configuração da app — embutida no build (`VITE_USER_ID` + `VITE_SITE_TOKEN`).
 * O endpoint `/websites/app/config` saiu da API com o site-engine (B35); não há config por host.
 */

export interface AppConfig {
  userId: string;
  siteToken: string;
  name: string;
  logoUrl: string | null;
  modules: string[]; // ex: ["gym", "schedule"]
}

let appConfig: AppConfig | null = null;

/** Mantém-se assíncrona: `main.tsx` e `umami.ts` esperam-na antes de arrancar. */
export async function loadAppConfig(): Promise<void> {
  if (appConfig) return;

  const userId = import.meta.env.VITE_USER_ID;
  if (!userId) {
    throw new Error("Aplicação sem VITE_USER_ID no build. Contacte o administrador.");
  }
  const siteToken = import.meta.env.VITE_SITE_TOKEN;
  if (!siteToken) {
    throw new Error("Aplicação sem VITE_SITE_TOKEN no build. Contacte o administrador.");
  }
  appConfig = {
    userId,
    siteToken,
    name: "GYMNOPRADO",
    logoUrl: null,
    modules: ["gym"],
  };
}

/**
 * Acesso síncrono à config já carregada (após loadAppConfig()).
 * Erro se chamado antes do load — use loadAppConfig() primeiro.
 */
export function getAppConfig(): AppConfig {
  if (!appConfig) {
    throw new Error(
      "App config não carregada. Chame loadAppConfig() no arranque antes de renderizar.",
    );
  }
  return appConfig;
}

/**
 * Acesso à config sem throw (fallback seguro para contextos raros).
 */
export function tryGetAppConfig(): AppConfig | null {
  return appConfig;
}

/**
 * Configuração da app por host/tenant — carregada no arranque.
 * Fonte: GET /websites/app/config?host={hostname}
 * Fallback dev: VITE_USER_ID no env (mantém o dev local atual a funcionar)
 */

export interface AppConfig {
  userId: string;
  siteToken: string;
  name: string;
  logoUrl: string | null;
  modules: string[]; // ex: ["gym", "schedule"]
}

let appConfig: AppConfig | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Carrega a config da app por host. Chamada UMA vez no arranque (antes de renderizar rotas).
 * Cache: memória + localStorage (chave: `gymnoprado_app_config_${hostname}`).
 * Offline: usa a cache de localStorage se o fetch falhar.
 * Dev: se VITE_USER_ID existir no env, bypassa o fetch e usa fallback local.
 * Lança erro se a app não conseguir ser carregada (sem cache válida).
 */
export async function loadAppConfig(): Promise<void> {
  // Uma só chamada ao longo da vida da app.
  if (appConfig) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<void> => {
    // Dev: se temos VITE_USER_ID embutido, usa fallback dev sem fetch.
    const devUserId = import.meta.env.VITE_USER_ID;
    const devSiteToken = import.meta.env.VITE_SITE_TOKEN;
    if (devUserId) {
      appConfig = {
        userId: devUserId,
        siteToken: devSiteToken ?? "",
        name: "GYMNOPRADO",
        logoUrl: null,
        modules: ["gym"],
      };
      return;
    }

    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const cacheKey = `gymnoprado_app_config_${hostname}`;

    try {
      // Tenta fetch do endpoint de config.
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
      const url = `${baseUrl}/websites/app/config?host=${encodeURIComponent(hostname)}`;
      const res = await fetch(url, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        appConfig = {
          userId: data.userId ?? "",
          siteToken: data.siteToken ?? "",
          name: data.name ?? "App",
          logoUrl: data.logoUrl ?? null,
          modules: data.modules ?? [],
        };
        // Cache: localStorage
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(appConfig));
          } catch {
            // quota exceeded ou SSR — silencia
          }
        }
        return;
      }
    } catch (err) {
      // rede ou parse error — tenta cache de localStorage
      console.warn("[appConfig] Fetch falhou, tentando cache de localStorage", err);
    }

    // Fallback: cache de localStorage
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          appConfig = JSON.parse(cached);
          return;
        }
      } catch {
        // parse error — continua para fallback vazio
      }
    }

    // Fallback final: app não configurada para este host.
    throw new Error(
      `Aplicação não configurada para ${hostname}. Contacte o administrador.`,
    );
  })();

  await loadPromise;
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

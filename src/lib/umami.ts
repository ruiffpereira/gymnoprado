/**
 * Injeta o script do Umami (auto-hospedado, cookieless).
 *
 * Pede à API o par {websiteId, src} do tenant desta app (pelo site token da
 * appConfig, que o client.ts põe em todos os pedidos). Sem site no Umami a API
 * devolve 204 e não se injecta nada — basta definir o domínio no Backoffice →
 * Estatísticas para começar a medir, sem novo deploy.
 * Não rastreia em localhost.
 *
 * B59 F2: SÓ arranca depois de o sócio aceitar a análise no aviso de cookies
 * (`CookieConsent`, escolha guardada em localStorage). Recusar, ou ainda não ter
 * escolhido, = o script nunca é pedido nem carregado.
 */
import { getWebsitesAnalyticsTracking } from "../gen-analytics/index";
import { loadAppConfig } from "./appConfig";

/** Chave da escolha do aviso de cookies ("accepted" | "rejected"). */
export const CONSENT_KEY = "cookie-consent";

export function analyticsAccepted(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false; // sem localStorage não há escolha guardada
  }
}

export async function initUmami(): Promise<void> {
  if (!analyticsAccepted()) return;
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1") return; // dev → não rastreia
  if (document.querySelector("script[data-website-id]")) return; // evita duplicação

  try {
    await loadAppConfig(); // o site token vem daqui
    const tracking = await getWebsitesAnalyticsTracking();
    if (!tracking?.websiteId || !tracking?.src) return; // 204 → tenant sem Umami

    const script = document.createElement("script");
    script.defer = true;
    script.src = tracking.src;
    script.dataset.websiteId = tracking.websiteId;
    document.head.appendChild(script);
  } catch {
    // Sem estatísticas nesta visita — a app funciona na mesma.
  }
}

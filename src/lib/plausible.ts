/**
 * Injeta o script do Plausible (auto-hospedado, cookieless) — AUTOMÁTICO.
 *
 * Usa o script clássico com `data-domain = hostname atual`, por isso qualquer
 * site/domínio é rastreado sem configuração por site (só precisa de existir o
 * Site correspondente no Plausible). URL da instância partilhada por default,
 * com override opcional via VITE_PLAUSIBLE_URL. Não rastreia em localhost.
 * Cookieless → não precisa de banner de consentimento.
 */
const PLAUSIBLE_URL =
  (import.meta.env.VITE_PLAUSIBLE_URL as string | undefined) || "https://analytics.rufvision.com";

export function initPlausible(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const domain = window.location.hostname;
  if (!domain || domain === "localhost" || domain === "127.0.0.1") return; // dev → não rastreia
  if (document.querySelector('script[data-plausible="1"]')) return; // evita duplicação

  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = domain;
  script.dataset.plausible = "1";
  script.src = `${PLAUSIBLE_URL.replace(/\/+$/, "")}/js/script.js`;
  document.head.appendChild(script);
}

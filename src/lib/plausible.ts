/**
 * Injeta o script do Plausible (auto-hospedado, cookieless) no <head>.
 *
 * Só corre se VITE_PLAUSIBLE_URL e VITE_PLAUSIBLE_DOMAIN estiverem definidos —
 * sem env é um no-op seguro. Cookieless → não precisa de banner de consentimento.
 */
export function initPlausible(): void {
  const url = import.meta.env.VITE_PLAUSIBLE_URL as string | undefined;
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;

  if (!url || !domain) return; // não configurado → não faz nada
  if (typeof document === "undefined") return;
  // Evita injeção dupla (StrictMode/HMR).
  if (document.querySelector('script[data-plausible="1"]')) return;

  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = domain;
  script.dataset.plausible = "1";
  script.src = `${url.replace(/\/+$/, "")}/js/script.js`;
  document.head.appendChild(script);
}

import { useEffect, useState } from "react";
import { useCms } from "../context/CmsContext";

const KEY = "cookie-consent";

/** Textos PT hardcoded — fallback se o CMS não tiver as chaves cookies.*. */
const PT = {
  title: "Cookies",
  text: "Usamos cookies essenciais para a app funcionar e, com o teu consentimento, cookies para melhorar a experiência. Escolhe para continuar.",
  accept: "Aceitar",
  reject: "Rejeitar",
};

/**
 * Consentimento de cookies (RGPD) — overlay BLOQUEANTE: aparece por cima de tudo
 * e impede o uso da página até o utilizador escolher. Guarda a escolha em
 * localStorage. Nota: por exigência do RGPD, "Rejeitar" também deixa entrar
 * (não é um cookie wall só-aceitar).
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const { t } = useCms();

  // CMS (língua atual) com fallback PT — nunca quebra se faltar a chave.
  const title = t("cookies.title") || PT.title;
  const text = t("cookies.text") || PT.text;
  const accept = t("cookies.accept") || PT.accept;
  const reject = t("cookies.reject") || PT.reject;

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

  // Tranca o scroll/interação da página enquanto o overlay está visível.
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  const choose = (v: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Consentimento de cookies"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 text-white shadow-2xl sm:p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-zinc-300">
          {text}{" "}
          <a href="/privacidade" className="underline underline-offset-2">
            {t("cookies.privacy") || "Política de privacidade"}
          </a>.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => choose("rejected")}
            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            {reject}
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
          >
            {accept}
          </button>
        </div>
      </div>
    </div>
  );
}

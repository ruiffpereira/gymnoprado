import { useEffect, useState } from "react";

const KEY = "cookie-consent";

/** Banner de consentimento de cookies (RGPD). Guarda a escolha em localStorage. */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

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
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="dialog" aria-label="Consentimento de cookies">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 p-4 text-white shadow-xl backdrop-blur sm:flex-row sm:items-center sm:p-5">
        <p className="flex-1 text-sm text-zinc-200">
          Usamos cookies essenciais para a app funcionar e, com o teu consentimento, para melhorar a experiência.{" "}
          <a href="/privacidade" className="underline underline-offset-2">Política de privacidade</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("rejected")}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Rejeitar
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

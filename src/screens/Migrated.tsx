import { useEffect } from "react";

/**
 * Página de despedida — mostrada quando a app foi migrada para um novo endereço.
 *
 * Esta página é renderizada em vez de toda a app quando a env VITE_MIGRATED_TO está definida.
 * Avisa o sócio que a app mudou de morada, que tudo continua lá e oferece um botão para ir.
 *
 * Também tenta desregistar o service worker e limpar as caches para que a PWA
 * não fique presa na versão antiga.
 */

export function Migrated({ newUrl }: { newUrl: string }) {
  useEffect(() => {
    // Desregistar o SW e limpar caches (PWA antigo)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((reg) => {
            reg.unregister();
          });
        })
        .catch(() => {
          // Silenciar erros de desregistro (pode não haver SW)
        });
    }

    // Limpar caches conhecidas
    if ("caches" in window) {
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
        .catch(() => {
          // Silenciar erros de limpeza de cache
        });
    }
  }, []);

  const handleOpen = () => {
    window.location.href = newUrl;
  };

  return (
    <div className="min-h-[100svh] bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ícone simbólico */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-brand"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-t1">
            Mudámos de casa
          </h1>
          <p className="text-base text-t2 leading-relaxed">
            A tua conta, o teu histórico e todos os teus treinos continuam 100% seguros no novo endereço.
          </p>
        </div>

        {/* Botão principal */}
        <button
          onClick={handleOpen}
          className="w-full bg-brand hover:bg-brand/90 active:bg-brand/80 text-white font-semibold py-3 px-6 rounded-btn transition-colors"
        >
          Ir para a nova app
        </button>

        {/* Nota discreta */}
        <div className="pt-4 border-t border-line">
          <p className="text-sm text-t3 leading-relaxed">
            <strong>Dica:</strong> Depois de instalares a nova app, podes apagá-la do ecrã inicial do teu telemóvel.
          </p>
        </div>
      </div>
    </div>
  );
}

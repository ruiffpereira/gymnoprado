import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { applyStoredTheme } from "./store/useTheme";
import { LanguageProvider } from "./context/LanguageContext";
import { CmsProvider } from "./context/CmsContext";
import { initPlausible } from "./lib/plausible";
import { loadAppConfig } from "./lib/appConfig";
import App from "./App";
import "./index.css";

const Spinner = () => (
  <div className="min-h-[100svh] flex items-center justify-center bg-bg">
    <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <div className="min-h-[100svh] flex items-center justify-center bg-bg">
    <div className="max-w-sm text-center px-4">
      <h1 className="text-xl font-bold text-text mb-2">Aplicação não configurada</h1>
      <p className="text-text-secondary">{message}</p>
    </div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);

applyStoredTheme();
initPlausible();

// Carrega a config da app por host — render bloqueante enquanto resolve.
root.render(<Spinner />);

loadAppConfig()
  .then(() => {
    // Config carregada com sucesso — renderiza a app completa.
    const basePath = import.meta.env.BASE_URL;
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={basePath}>
            <LanguageProvider>
              <CmsProvider>
                <App />
              </CmsProvider>
            </LanguageProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  })
  .catch((err) => {
    // Erro fatal (app não configurada) — mostra mensagem de erro.
    root.render(
      <ErrorScreen
        message={err instanceof Error ? err.message : "Erro ao carregar configuração."}
      />,
    );
  });

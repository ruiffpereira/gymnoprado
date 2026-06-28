import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { applyStoredTheme } from "./store/useTheme";
import { LanguageProvider } from "./context/LanguageContext";
import { CmsProvider } from "./context/CmsContext";
import { initPlausible } from "./lib/plausible";
import App from "./App";
import "./index.css";

applyStoredTheme();
// Estatísticas (Plausible, cookieless) — no-op sem env configurado.
initPlausible();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <CmsProvider>
            <App />
          </CmsProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

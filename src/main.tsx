import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { applyStoredTheme } from "./store/useTheme";
import { LanguageProvider } from "./context/LanguageContext";
import { CmsProvider } from "./context/CmsContext";
import App from "./App";
import "./index.css";

applyStoredTheme();

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

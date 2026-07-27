import { createContext, useContext, type ReactNode } from "react";
import { useWebsiteContent } from "../api/cms";
import { useLanguage } from "./LanguageContext";
// Bundles i18n da plataforma (gerados por scripts/csvToI18n.mjs a partir do
// content-import.csv). Import ESTÁTICO de propósito: empacotados no build,
// funcionam offline e sob qualquer base path — nunca por fetch em runtime.
import bundlePt from "../i18n/pt.json";
import bundleEn from "../i18n/en.json";

interface CmsCtx {
  /**
   * Traduz uma chave CMS com cascata:
   * 1. CMS do tenant (se a chave existir e não vazia)
   * 2. Bundle i18n estático da plataforma
   * 3. Vazio
   *
   * Código cliente continua com fallbacks: `t("key") || "fallback PT"`
   */
  t: (key: string) => string;
  loading: boolean;
}

const CmsContext = createContext<CmsCtx>({ t: () => "", loading: true });

export function CmsProvider({ children }: { children: ReactNode }) {
  const { currentLang } = useLanguage();
  const { data: cms, isLoading } = useWebsiteContent(currentLang);

  const t = (key: string): string => {
    // 1. CMS do tenant (override deliberado por tenant)
    const cmsValue = cms?.[key];
    if (cmsValue && cmsValue.trim() !== "") return cmsValue;

    // 2. Bundle i18n da plataforma (gym.app.*; língua desconhecida → pt)
    const bundle: Record<string, string> = currentLang === "en" ? bundleEn : bundlePt;
    const bundleValue = bundle[key];
    if (bundleValue) return bundleValue;

    // 3. Vazio (código cliente usa `|| "fallback PT"`)
    return "";
  };

  return (
    <CmsContext.Provider value={{ t, loading: isLoading }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}

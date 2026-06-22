import { createContext, useContext, type ReactNode } from "react";
import { useWebsiteContent } from "../api/cms";
import { useLanguage } from "./LanguageContext";

interface CmsCtx {
  /** Traduz uma chave CMS. Sem fallback: vazio se a entrada não existir. */
  t: (key: string) => string;
  loading: boolean;
}

const CmsContext = createContext<CmsCtx>({ t: () => "", loading: true });

export function CmsProvider({ children }: { children: ReactNode }) {
  const { currentLang } = useLanguage();
  const { data: cms, isLoading } = useWebsiteContent(currentLang);

  const t = (key: string) => cms?.[key] ?? "";

  return (
    <CmsContext.Provider value={{ t, loading: isLoading }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}

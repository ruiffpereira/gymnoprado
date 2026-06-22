// Facade do CMS público (conteúdos + línguas) sobre os hooks gerados pelo Kubb
// (src/gen-cms, do spec /api-docs/websites/content.json). Sem chamadas manuais.
import { keepPreviousData } from "@tanstack/react-query";
import { useGetWebsitesLanguages } from "../gen-cms/hooks/useGetWebsitesLanguages.js";
import { useGetWebsitesContent } from "../gen-cms/hooks/useGetWebsitesContent.js";
import type { Language } from "../gen-cms/types/Language.js";

export type WebsiteLanguage = Language;

export { usePutWebsitesLanguagesMe } from "../gen-cms/hooks/usePutWebsitesLanguagesMe.js";
export { getWebsitesContentQueryKey } from "../gen-cms/hooks/useGetWebsitesContent.js";

/** Línguas ativas do tenant (+ língua padrão). */
export function useWebsiteLanguages() {
  return useGetWebsitesLanguages({ query: { staleTime: Infinity, retry: false } });
}

/** Conteúdos CMS na língua pedida (mapa key→valor). */
export function useWebsiteContent(locale: string) {
  return useGetWebsitesContent(
    { locale },
    { query: { enabled: !!locale, staleTime: 55_000, placeholderData: keepPreviousData } },
  );
}

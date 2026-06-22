import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useWebsiteLanguages, usePutWebsitesLanguagesMe, getWebsitesContentQueryKey, type WebsiteLanguage } from "../api/cms";
import { useSession } from "../store/useSession";
import { queryClient } from "../lib/queryClient";

const LANG_KEY = "gymnoprado_lang";

interface LanguageCtx {
  currentLang: string;
  languages: WebsiteLanguage[];
  changeLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageCtx>({
  currentLang: "pt",
  languages: [],
  changeLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status);
  const [currentLang, setCurrentLang] = useState("pt");

  const { data: langData } = useWebsiteLanguages();
  const languages = langData?.languages ?? [];
  const defaultLang = langData?.default ?? "pt";

  const { mutate: updateLang } = usePutWebsitesLanguagesMe();

  // Escolhe a língua inicial: guardada (se válida) → padrão do tenant.
  useEffect(() => {
    if (languages.length === 0) return;
    const codes = languages.map((l) => l.code);
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && codes.includes(stored)) setCurrentLang(stored);
    else setCurrentLang(defaultLang);
  }, [languages, defaultLang]);

  const changeLanguage = useCallback(
    (code: string) => {
      setCurrentLang(code);
      localStorage.setItem(LANG_KEY, code);
      // Autenticado: o /content E os endpoints do gym usam o defaultLanguage do
      // customer, por isso guarda a preferência no servidor e refaz tudo o que
      // traz texto/nomes resolvidos por locale.
      if (status === "authed") {
        updateLang(
          { data: { language: code } },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getWebsitesContentQueryKey() });
              // Nomes de programas/treinos/exercícios são resolvidos pela locale na API.
              queryClient.invalidateQueries({ queryKey: [{ url: "/websites/gym/programs" }] });
              queryClient.invalidateQueries({ queryKey: [{ url: "/websites/gym/programs/active" }] });
              queryClient.invalidateQueries({ queryKey: [{ url: "/websites/gym/exercises" }] });
              queryClient.invalidateQueries({ queryKey: [{ url: "/websites/gym/stats/records" }] });
            },
          },
        );
      }
    },
    [status, updateLang],
  );

  return (
    <LanguageContext.Provider value={{ currentLang, languages, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

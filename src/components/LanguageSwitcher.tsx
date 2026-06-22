import { useLanguage } from "../context/LanguageContext";

/** Seletor de língua (pills das línguas ativas do tenant). */
export function LanguageSwitcher() {
  const { currentLang, languages, changeLanguage } = useLanguage();
  if (languages.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {languages.map((l) => {
        const active = l.code === currentLang;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => changeLanguage(l.code)}
            className={`px-3 py-1.5 rounded-pill text-sm font-semibold transition-colors ${
              active
                ? "bg-brand text-white"
                : "bg-bg text-t2 hover:text-t1"
            }`}
          >
            {(l.name ?? l.code).toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

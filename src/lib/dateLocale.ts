import { pt, enGB } from "date-fns/locale";
import type { Locale } from "date-fns";

/** Resolve o locale do date-fns consoante a língua ativa.
 * @param lang Código de língua (ex: "pt", "en")
 */
export function getDateLocale(lang: string): Locale {
  switch (lang?.toLowerCase()) {
    case "en":
    case "en-us":
    case "en-gb":
      return enGB;
    // PT é a língua base da plataforma — línguas desconhecidas caem para PT,
    // coerente com todos os fallbacks de texto da app.
    default:
      return pt;
  }
}

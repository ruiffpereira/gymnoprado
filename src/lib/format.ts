import { differenceInCalendarDays, parseISO } from "date-fns";

/** Traduz "há X dias" / "hoje" / "ontem" a partir de uma data ISO.
 * @param iso Data em formato ISO ou undefined
 * @param t Função de tradução CMS que devolve a chave traduzida
 */
export function relativeDays(iso: string | null | undefined, t: (key: string) => string): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  const diff = differenceInCalendarDays(new Date(), d);
  if (diff <= 0) return t("gym.app.time.today") || "hoje";
  if (diff === 1) return t("gym.app.time.yesterday") || "ontem";
  if (diff < 7) return (t("gym.app.time.days_ago") || "há {n} dias").replace("{n}", String(diff));
  if (diff < 14) return (t("gym.app.time.days_ago") || "há {n} dias").replace("{n}", "7");
  if (diff < 30) return (t("gym.app.time.days_ago") || "há {n} dias").replace("{n}", String(Math.floor(diff / 7)));
  if (diff < 60) return (t("gym.app.time.days_ago") || "há {n} dias").replace("{n}", "1");
  return (t("gym.app.time.days_ago") || "há {n} dias").replace("{n}", String(Math.floor(diff / 30)));
}

/** Traduz saudação consoante hora do dia.
 * @param name Nome do utilizador (opcional)
 * @param t Função de tradução CMS
 */
export function greeting(t: (key: string) => string, name?: string): string {
  const h = new Date().getHours();
  const part = h < 12
    ? t("gym.app.greeting.morning") || "Bom dia"
    : h < 20
    ? t("gym.app.greeting.afternoon") || "Boa tarde"
    : t("gym.app.greeting.evening") || "Boa noite";
  const first = name?.trim().split(" ")[0];
  return first ? `${part}, ${first}` : part;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Data LOCAL `yyyy-MM-dd` (não UTC). Usar para carimbar registos do utilizador
 * (ex.: a `date` do log de treino): entre as 00:00 e a 01:00 em horário de
 * verão PT, `toISOString()` ainda devolve o dia ANTERIOR — o treino ficaria no
 * dia errado no histórico/streak.
 */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

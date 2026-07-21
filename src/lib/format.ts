import { differenceInCalendarDays, parseISO } from "date-fns";

/** "há X dias" / "hoje" / "ontem" a partir de uma data ISO. */
export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  const diff = differenceInCalendarDays(new Date(), d);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 14) return "há 1 semana";
  if (diff < 30) return `há ${Math.floor(diff / 7)} semanas`;
  if (diff < 60) return "há 1 mês";
  return `há ${Math.floor(diff / 30)} meses`;
}

export function greeting(name?: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Bom dia" : h < 20 ? "Boa tarde" : "Boa noite";
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

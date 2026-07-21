// Grupos musculares e cores (alinhado com o design e o backend)
export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Abdómen",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const GROUP_COLORS: Record<string, string> = {
  Peito: "#3B82F6",
  Costas: "#8B5CF6",
  Ombros: "#F59E0B",
  Bíceps: "#EC4899",
  Tríceps: "#EF4444",
  Pernas: "#10B981",
  Glúteos: "#F97316",
  Abdómen: "#6B7280",
};

export const groupColor = (g?: string | null): string =>
  (g && GROUP_COLORS[g]) || "#6B7280";

/** Traduz um nome de grupo muscular via CMS ou retorna o valor PT. */
export function translateMuscleGroup(group: string | undefined, t: (key: string) => string): string {
  if (!group) return "";
  const key = `gym.app.muscle.${group}`;
  return t(key) || group;
}

// Dias da semana (0 = Domingo … 6 = Sábado) — alinhado com o backend
// Fallbacks PT; usar via CMS com translateWeekday*() para multilingue
export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAYS_LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

/** Traduz dia da semana (abreviado) via CMS. Índice 0-6 (0=Dom).
 * @param dayIndex 0-6 (0 = Domingo)
 * @param t Função de tradução CMS
 */
export function translateWeekdayShort(dayIndex: number, t: (key: string) => string): string {
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = `gym.app.calendar.day.short.${keys[dayIndex % 7]}`;
  return t(key) || WEEKDAYS_SHORT[dayIndex % 7];
}

/** Traduz dia da semana (nome completo) via CMS. Índice 0-6 (0=Domingo).
 * @param dayIndex 0-6 (0 = Domingo)
 * @param t Função de tradução CMS
 */
export function translateWeekdayLong(dayIndex: number, t: (key: string) => string): string {
  const keys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const keyIndex = (dayIndex - 1 + 7) % 7; // ajusta 0-6 (Dom-Sáb) para 0-6 (Mon-Sun)
  const key = `gym.app.calendar.day.long.${keys[keyIndex]}`;
  return t(key) || WEEKDAYS_LONG[dayIndex % 7];
}

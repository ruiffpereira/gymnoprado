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

// Dias da semana (0 = Domingo … 6 = Sábado) — alinhado com o backend
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

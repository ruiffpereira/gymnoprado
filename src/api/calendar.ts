// API manual do calendário de treinos (.ics). Não há hooks gerados pelo Kubb
// para estes endpoints (evita regenerar o spec aqui); usa a instância axios
// partilhada, já configurada com Bearer + X-Site-Token.
import { axiosInstance } from "@kubb/plugin-client/clients/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type CalendarStatus = "ok" | "no_plan" | "ended" | "blocked";

export interface CalendarPrefs {
  /** Mapa dia-da-semana (0=Dom..6=Sáb) → "HH:MM". */
  weekdayTimes: Record<string, string>;
  defaultTime: string;
  freeDays: number;
  durationMin: number;
  /** Estado do programa ativo (para a mensagem certa). */
  status: CalendarStatus;
  /** Modo do programa ativo: "weekly" (dias da semana) ou "free" (frequência). */
  mode: "weekly" | "free" | null;
  token: string;
  url: string;
  webcalUrl: string;
}

const KEY = ["gym", "calendar"] as const;

async function fetchPrefs(): Promise<CalendarPrefs> {
  const res = await axiosInstance.get<CalendarPrefs>("/websites/gym/calendar");
  return res.data;
}

export interface CalendarPrefsInput {
  weekdayTimes?: Record<string, string>;
  defaultTime?: string;
  freeDays?: number;
  durationMin?: number;
}

async function savePrefs(input: CalendarPrefsInput): Promise<CalendarPrefs> {
  const res = await axiosInstance.put<CalendarPrefs>("/websites/gym/calendar", input);
  return res.data;
}

/** Preferências de calendário + URL de subscrição (gera o token na 1.ª vez). */
export function useCalendarPrefs() {
  return useQuery({ queryKey: KEY, queryFn: fetchPrefs, staleTime: 30_000 });
}

/** Guarda as preferências de hora; atualiza a cache. */
export function useSaveCalendarPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savePrefs,
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}

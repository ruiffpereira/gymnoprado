import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@kubb/plugin-client/clients/axios";
import { createLog, usePrograms } from "../api";
import type { GymProgram, GymWorkout } from "../api";
import type { PostWebsitesGymLogsMutationRequest } from "../gen/types/PostWebsitesGymLogs";

/** Resposta de GET /websites/gym/programs/active. */
export interface ActiveProgramResponse {
  /** Programa marcado como ativo pelo coach (null se nenhum). */
  program: GymProgram | null;
  /** Treino a fazer agora (menos feito → ordem). */
  nextWorkoutId: string | null;
  /** Meta semanal = nº de dias da semana do programa. */
  weeklyGoal: number;
}

/**
 * Programa ativo do cliente + o treino a fazer agora + meta semanal.
 * O "treino a fazer agora" segue a regra do servidor (menos concluído, depois
 * ordem) — faltar ou saltar treinos é tratado automaticamente.
 */
export function useActiveProgram() {
  return useQuery<ActiveProgramResponse>({
    queryKey: [{ url: "/websites/gym/programs/active" }],
    queryFn: async () => {
      const res = await axiosInstance.get<ActiveProgramResponse>(
        "/websites/gym/programs/active",
      );
      return res.data;
    },
  });
}

/** Todos os treinos achatados, com o programa a que pertencem. */
export function useAllWorkouts() {
  const { data: programs, ...rest } = usePrograms();
  const items = ((programs ?? []) as GymProgram[]).flatMap((p) =>
    p.workouts.map((w) => ({ workout: w as GymWorkout, program: p })),
  );
  return { items, programs: (programs ?? []) as GymProgram[], ...rest };
}

/** Encontra um treino (e o seu programa) por id. */
export function useFindWorkout(id?: string) {
  const { items, isLoading, isError } = useAllWorkouts();
  const found = id ? items.find((i) => i.workout.id === id) : undefined;
  return { workout: found?.workout, program: found?.program, isLoading, isError };
}

/** Invalida tudo o que depende de treinos/sessões (chaves do Kubb por url). */
export function useInvalidateGym() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/programs" }] });
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/programs/active" }] });
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/logs" }] });
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/stats/summary" }] });
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/stats/weekly" }] });
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/stats/records" }] });
    qc.invalidateQueries({ queryKey: [{ url: "/websites/gym/me" }] });
  };
}

export function useCreateLog() {
  const invalidate = useInvalidateGym();
  return useMutation({
    mutationFn: (data: PostWebsitesGymLogsMutationRequest) => createLog(data),
    onSuccess: invalidate,
  });
}

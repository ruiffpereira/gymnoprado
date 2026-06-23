// Facade sobre os hooks/tipos gerados pelo Kubb — nomes curtos para os ecrãs.

// ── Hooks de leitura (React Query) ─────────────────────────────────────────────
export { useGetWebsitesGymPrograms as usePrograms } from "../gen/hooks/useGetWebsitesGymPrograms";
export { useGetWebsitesGymExercises as useCatalog } from "../gen/hooks/useGetWebsitesGymExercises";
export { useGetWebsitesGymLogs as useLogs } from "../gen/hooks/useGetWebsitesGymLogs";
export { useGetWebsitesGymMe as useMe } from "../gen/hooks/useGetWebsitesGymMe";
export { useGetWebsitesGymStatsSummary as useSummary } from "../gen/hooks/useGetWebsitesGymStatsSummary";
export { useGetWebsitesGymStatsWeekly as useWeekly } from "../gen/hooks/useGetWebsitesGymStatsWeekly";
export { useGetWebsitesGymStatsRecords as useRecords } from "../gen/hooks/useGetWebsitesGymStatsRecords";
export { useGetWebsitesGymWorkoutsIdLast as useLastPerformance } from "../gen/hooks/useGetWebsitesGymWorkoutsIdLast";

// ── Funções imperativas (para mutations) ───────────────────────────────────────
export { getWebsitesGymMe } from "../gen/hooks/useGetWebsitesGymMe";
export { postWebsitesGymPrograms as createProgram } from "../gen/hooks/usePostWebsitesGymPrograms";
export { patchWebsitesGymProgramsId as updateProgram } from "../gen/hooks/usePatchWebsitesGymProgramsId";
export { deleteWebsitesGymProgramsId as deleteProgram } from "../gen/hooks/useDeleteWebsitesGymProgramsId";
export { postWebsitesGymProgramsProgramidWorkouts as createWorkout } from "../gen/hooks/usePostWebsitesGymProgramsProgramidWorkouts";
export { patchWebsitesGymWorkoutsId as updateWorkout } from "../gen/hooks/usePatchWebsitesGymWorkoutsId";
export { deleteWebsitesGymWorkoutsId as deleteWorkout } from "../gen/hooks/useDeleteWebsitesGymWorkoutsId";
export { postWebsitesGymWorkoutsIdClone as cloneWorkout } from "../gen/hooks/usePostWebsitesGymWorkoutsIdClone";
export { postWebsitesGymLogs as createLog } from "../gen/hooks/usePostWebsitesGymLogs";
export { getWebsitesGymWorkoutsIdLast as getLastPerformance } from "../gen/hooks/useGetWebsitesGymWorkoutsIdLast";

// ── Tipos ──────────────────────────────────────────────────────────────────────
export type { GymProgram } from "../gen/types/GymProgram";
export type { GymWorkout } from "../gen/types/GymWorkout";
export type { GymWorkoutExercise } from "../gen/types/GymWorkoutExercise";
export type { GymCatalogExercise } from "../gen/types/GymCatalogExercise";
export type { GymLog } from "../gen/types/GymLog";
export type { GymProfile } from "../gen/types/GymProfile";
export type { GymSummary } from "../gen/types/GymSummary";
export type { GymWeeklyPoint } from "../gen/types/GymWeeklyPoint";
export type { GymRecord } from "../gen/types/GymRecord";
export type { GymWorkoutInput } from "../gen/types/GymWorkoutInput";
export type { GymExerciseInput } from "../gen/types/GymExerciseInput";
export type { GetWebsitesGymWorkoutsIdLast200 as GymLastPerformance } from "../gen/types/GetWebsitesGymWorkoutsIdLast";

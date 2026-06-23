import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GymWorkout as Workout } from "../gen/types/GymWorkout";
import type { PostWebsitesGymLogsMutationRequest as LogInput } from "../gen/types/PostWebsitesGymLogs";
import type { GetWebsitesGymWorkoutsIdLast200 as LastPerformance } from "../gen/types/GetWebsitesGymWorkoutsIdLast";

export interface SetEntry {
  weight: number;
  reps: number;
  done: boolean;
}

export interface ActiveExercise {
  exerciseId: string | null;
  name: string;
  group: string;
  rest: number;
  mediaUrl: string | null;
  targetReps: number;
  targetWeight: number;
  sets: SetEntry[];
}

interface ActiveWorkoutState {
  workoutId: string | null;
  name: string;
  startedAt: number | null;
  currentIndex: number;
  /** Série ativa por exercício (índice). */
  activeSet: number[];
  exercises: ActiveExercise[];
  start: (w: Workout, last?: LastPerformance | null) => void;
  setIndex: (i: number) => void;
  setActiveSet: (exIdx: number, setIdx: number) => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<SetEntry>) => void;
  toggleDone: (exIdx: number, setIdx: number) => void;
  setDone: (exIdx: number, setIdx: number, done: boolean) => void;
  totalSets: () => number;
  doneSets: () => number;
  buildLog: () => LogInput;
  clear: () => void;
}

/**
 * Pré-preenche as séries de um exercício a partir da última sessão (match por
 * nome). A série N usa o setIndex N; se a última vez teve menos séries, as
 * extra herdam a última conhecida. Sem histórico → alvo do coach.
 */
function prefillSets(
  ex: Workout["exercises"][number],
  count: number,
  last?: LastPerformance | null,
): SetEntry[] {
  const prev = last?.entries.find((e) => e.exerciseName === ex.name)?.sets;
  return Array.from({ length: count }, (_, j) => {
    const src = prev && prev.length > 0 ? prev[Math.min(j, prev.length - 1)] : null;
    return {
      weight: src ? src.weight : ex.weight,
      reps: src ? src.reps : ex.reps,
      done: false,
    };
  });
}

export const useActiveWorkout = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      workoutId: null,
      name: "",
      startedAt: null,
      currentIndex: 0,
      activeSet: [],
      exercises: [],

      start: (w, last) =>
        set({
          workoutId: w.id,
          name: w.name,
          startedAt: Date.now(),
          currentIndex: 0,
          activeSet: w.exercises.map(() => 0),
          exercises: w.exercises.map((e) => ({
            exerciseId: e.exerciseId ?? null,
            name: e.name,
            group: e.group,
            rest: e.rest || 60,
            mediaUrl: e.mediaUrl ?? null,
            targetReps: e.reps,
            targetWeight: e.weight,
            sets: prefillSets(e, Math.max(1, e.sets), last),
          })),
        }),

      setIndex: (i) => set({ currentIndex: i }),

      setActiveSet: (exIdx, setIdx) =>
        set((s) => {
          const activeSet = [...s.activeSet];
          activeSet[exIdx] = setIdx;
          return { activeSet };
        }),

      updateSet: (exIdx, setIdx, patch) =>
        set((s) => {
          const exercises = s.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st, j) => (j === setIdx ? { ...st, ...patch } : st)) },
          );
          return { exercises };
        }),

      toggleDone: (exIdx, setIdx) =>
        set((s) => {
          const exercises = s.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st, j) => (j === setIdx ? { ...st, done: !st.done } : st)) },
          );
          return { exercises };
        }),

      setDone: (exIdx, setIdx, done) =>
        set((s) => {
          const exercises = s.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st, j) => (j === setIdx ? { ...st, done } : st)) },
          );
          return { exercises };
        }),

      totalSets: () => get().exercises.reduce((acc, e) => acc + e.sets.length, 0),
      doneSets: () =>
        get().exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.done).length, 0),

      buildLog: () => {
        const s = get();
        const durationMin = s.startedAt
          ? Math.max(1, Math.round((Date.now() - s.startedAt) / 60000))
          : 0;
        return {
          workoutId: s.workoutId,
          workoutName: s.name,
          durationMin,
          totalSets: s.doneSets(),
          entries: s.exercises.map((e) => ({
            exerciseName: e.name,
            group: e.group,
            sets: e.sets.map((st) => ({ weight: st.weight, reps: st.reps, done: st.done })),
          })),
        };
      },

      clear: () =>
        set({
          workoutId: null,
          name: "",
          startedAt: null,
          currentIndex: 0,
          activeSet: [],
          exercises: [],
        }),
    }),
    { name: "gymnoprado_active_workout" },
  ),
);

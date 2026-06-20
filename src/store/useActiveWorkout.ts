import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GymWorkout as Workout } from "../gen/types/GymWorkout";
import type { PostWebsitesGymLogsMutationRequest as LogInput } from "../gen/types/PostWebsitesGymLogs";

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
  exercises: ActiveExercise[];
  start: (w: Workout) => void;
  setIndex: (i: number) => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<SetEntry>) => void;
  toggleDone: (exIdx: number, setIdx: number) => void;
  totalSets: () => number;
  doneSets: () => number;
  buildLog: () => LogInput;
  clear: () => void;
}

export const useActiveWorkout = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      workoutId: null,
      name: "",
      startedAt: null,
      currentIndex: 0,
      exercises: [],

      start: (w) =>
        set({
          workoutId: w.id,
          name: w.name,
          startedAt: Date.now(),
          currentIndex: 0,
          exercises: w.exercises.map((e) => ({
            exerciseId: e.exerciseId ?? null,
            name: e.name,
            group: e.group,
            rest: e.rest || 60,
            mediaUrl: e.mediaUrl ?? null,
            targetReps: e.reps,
            targetWeight: e.weight,
            sets: Array.from({ length: Math.max(1, e.sets) }, () => ({
              weight: e.weight,
              reps: e.reps,
              done: false,
            })),
          })),
        }),

      setIndex: (i) => set({ currentIndex: i }),

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
        set({ workoutId: null, name: "", startedAt: null, currentIndex: 0, exercises: [] }),
    }),
    { name: "gymnoprado_active_workout" },
  ),
);

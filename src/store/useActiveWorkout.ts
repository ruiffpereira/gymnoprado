import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GymWorkout as Workout } from "../gen/types/GymWorkout";
import type { PostWebsitesGymLogsMutationRequest as LogInput } from "../gen/types/PostWebsitesGymLogs";
import type { GetWebsitesGymWorkoutsIdLast200 as LastPerformance } from "../gen/types/GetWebsitesGymWorkoutsIdLast";

export interface SetEntry {
  weight: number;
  reps: number;
  duration: number;
  done: boolean;
  /** Descanso (s) a fazer DEPOIS desta série (0 entre passos de um dropset). */
  rest: number;
  /** Série composta (dropset): nº do passo (1-based) e total de passos do grupo. */
  dropStep?: number;
  dropTotal?: number;
  /** Valor da última sessão (referência; null se não houver histórico). */
  lastWeight: number | null;
  lastReps: number | null;
  lastDuration: number | null;
}

export interface ActiveExercise {
  exerciseId: string | null;
  name: string;
  group: string;
  /** "strength" = peso/reps · "time" = duração (ex: prancha). */
  type: "strength" | "time";
  rest: number;
  mediaUrl: string | null;
  targetReps: number;
  targetWeight: number;
  targetDuration: number;
  sets: SetEntry[];
}

/**
 * Estado de descanso/pausa entre séries. Vive no store persistido (e não em
 * estado local do ecrã) para **sobreviver a fechar/reabrir a app**: ao voltar,
 * o treino continua em descanso em vez de saltar para o "FAZER AGORA".
 *
 * Wall-clock (não decremental): `endsAt` é o instante (epoch ms) em que o
 * descanso termina. Os segundos restantes derivam-se sempre de
 * `endsAt - Date.now()` no ecrã — nunca se guarda um contador que decrementa
 * a cada tick, porque esse tipo de contador **congela** quando a app vai para
 * background (o `setTimeout`/`setInterval` para de correr) e fica errado ao
 * voltar. Com `endsAt`, mesmo que a app esteja fechada 2 minutos com um
 * descanso de 60s, ao reabrir o cálculo dá logo "terminado" e avança.
 */
export interface RestState {
  /** Instante (epoch ms) em que o descanso termina. */
  endsAt: number;
  total: number;
  kind: "normal" | "drop";
  msg: string;
  /** Série a concluir + a partir da qual avançar quando o descanso terminar. */
  exIdx: number;
  setIdx: number;
}

/** Dados para iniciar um descanso — `endsAt` é calculado pelo store a partir de `total`. */
type StartRestInput = Omit<RestState, "endsAt">;

interface ActiveWorkoutState {
  workoutId: string | null;
  name: string;
  startedAt: number | null;
  currentIndex: number;
  /** Série ativa por exercício (índice). */
  activeSet: number[];
  exercises: ActiveExercise[];
  /** Descanso/pausa em curso (null = a treinar). Persistido. */
  rest: RestState | null;
  start: (w: Workout, last?: LastPerformance | null) => void;
  setIndex: (i: number) => void;
  setActiveSet: (exIdx: number, setIdx: number) => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<SetEntry>) => void;
  toggleDone: (exIdx: number, setIdx: number) => void;
  setDone: (exIdx: number, setIdx: number, done: boolean) => void;
  /** Conclui a série e avança para a próxima série/exercício. */
  advanceAfterSet: (exIdx: number, setIdx: number) => void;
  /** Inicia o descanso — calcula `endsAt = Date.now() + total*1000` (wall-clock). */
  startRest: (r: StartRestInput) => void;
  /** Fim do descanso → conclui a série guardada e avança. */
  finishRest: () => void;
  /** Cancela o descanso sem avançar (saltar/reabrir série, etc.). */
  cancelRest: () => void;
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
  const isTime = (ex as any).type === "time";
  const rest = ex.rest || 60;
  return Array.from({ length: count }, (_, j) => {
    const src = prev && prev.length > 0 ? prev[Math.min(j, prev.length - 1)] : null;
    return {
      weight: src ? src.weight : ex.weight,
      reps: src ? src.reps : ex.reps,
      duration: isTime ? ((ex as any).duration ?? 0) : ((src as any)?.duration ?? 0),
      done: false,
      rest,
      lastWeight: src ? src.weight : null,
      lastReps: src ? src.reps : null,
      lastDuration: src ? ((src as any).duration ?? null) : null,
    };
  });
}

/**
 * Constrói as séries de um exercício. Em modo série-a-série (`mode==="perSet"`),
 * cada `setRow` traz o seu próprio alvo de reps/peso e uma série composta
 * (dropset) é **expandida** num registo por passo — para que TUDO (peso/reps de
 * cada passo) fique registado e alimente as estatísticas. Caso contrário usa o
 * pré-preenchimento uniforme (sets × reps × peso) com referência à última sessão.
 */
function buildSets(
  ex: Workout["exercises"][number],
  last?: LastPerformance | null,
): SetEntry[] {
  const setRows = (ex as any).setRows as
    | { reps?: number; weight?: number; rest?: number; drop?: boolean; steps?: { reps?: number; weight?: number; rest?: number }[] }[]
    | null
    | undefined;
  if ((ex as any).mode === "perSet" && Array.isArray(setRows) && setRows.length) {
    type Tgt = { reps: number; weight: number; rest: number; dropStep?: number; dropTotal?: number };
    const defRest = ex.rest || 60;
    const targets: Tgt[] = [];
    for (const r of setRows) {
      if (r.drop && Array.isArray(r.steps) && r.steps.length) {
        const n = r.steps.length;
        // Passos seguidos (descanso curto entre eles); só o último usa o descanso pós-série.
        r.steps.forEach((s, i) =>
          targets.push({
            reps: s.reps ?? 0,
            weight: s.weight ?? 0,
            rest: i === n - 1 ? (r.rest ?? defRest) : (s.rest ?? 0),
            dropStep: i + 1,
            dropTotal: n,
          }),
        );
      } else {
        targets.push({ reps: r.reps ?? 0, weight: r.weight ?? 0, rest: r.rest ?? defRest });
      }
    }
    const prev = last?.entries.find((e) => e.exerciseName === ex.name)?.sets;
    return targets.map((t, j) => {
      const src = prev && prev.length > 0 ? prev[Math.min(j, prev.length - 1)] : null;
      return {
        weight: src ? src.weight : t.weight,
        reps: src ? src.reps : t.reps,
        duration: 0,
        done: false,
        rest: t.rest,
        dropStep: t.dropStep,
        dropTotal: t.dropTotal,
        lastWeight: src ? src.weight : null,
        lastReps: src ? src.reps : null,
        lastDuration: src ? ((src as any).duration ?? null) : null,
      };
    });
  }
  return prefillSets(ex, Math.max(1, ex.sets), last);
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
      rest: null,

      start: (w, last) =>
        set({
          workoutId: w.id,
          name: w.name,
          startedAt: Date.now(),
          currentIndex: 0,
          activeSet: w.exercises.map(() => 0),
          rest: null,
          exercises: w.exercises.map((e) => ({
            exerciseId: e.exerciseId ?? null,
            name: e.name,
            group: e.group,
            type: (e as any).type === "time" ? "time" : "strength",
            rest: e.rest || 60,
            mediaUrl: e.mediaUrl ?? null,
            targetReps: e.reps,
            targetWeight: e.weight,
            targetDuration: (e as any).duration ?? 0,
            sets: buildSets(e, last),
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

      advanceAfterSet: (exIdx, setIdx) =>
        set((s) => {
          const exercises = s.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st, j) => (j === setIdx ? { ...st, done: true } : st)) },
          );
          const exer = exercises[exIdx];
          const patch: Partial<ActiveWorkoutState> = { exercises, rest: null };
          if (exer.sets.every((st) => st.done)) {
            // Exercício concluído → próximo exercício.
            patch.currentIndex = Math.min(exIdx + 1, exercises.length - 1);
          } else {
            // Próxima série por fazer dentro do mesmo exercício.
            const np = exer.sets.findIndex((st, i) => i !== setIdx && !st.done);
            if (np !== -1) {
              const activeSet = [...s.activeSet];
              activeSet[exIdx] = np;
              patch.activeSet = activeSet;
            }
          }
          return patch;
        }),

      startRest: (r) => set({ rest: { ...r, endsAt: Date.now() + r.total * 1000 } }),
      finishRest: () => {
        const r = get().rest;
        if (r) get().advanceAfterSet(r.exIdx, r.setIdx);
        else set({ rest: null });
      },
      cancelRest: () => set({ rest: null }),

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
            sets: e.sets.map((st) => ({ weight: st.weight, reps: st.reps, duration: st.duration, done: st.done } as any)),
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
          rest: null,
        }),
    }),
    {
      name: "gymnoprado_active_workout",
      // v1: `rest` passou de contador decremental (`remaining`) para wall-clock
      // (`endsAt`). Migra qualquer estado persistido de uma versão anterior
      // (treino já em curso no telemóvel, com um `rest` sem `endsAt`) em vez de
      // simplesmente descartar o descanso em progresso.
      version: 1,
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted?.rest && typeof persisted.rest.endsAt !== "number") {
          const remaining = typeof persisted.rest.remaining === "number" ? persisted.rest.remaining : 0;
          persisted.rest = { ...persisted.rest, endsAt: Date.now() + Math.max(0, remaining) * 1000 };
          delete persisted.rest.remaining;
        }
        return persisted;
      },
    },
  ),
);

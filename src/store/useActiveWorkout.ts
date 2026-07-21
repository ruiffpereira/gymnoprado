import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GymWorkout as Workout } from "../gen/types/GymWorkout";
import type { PostWebsitesGymLogsMutationRequest as LogInput } from "../gen/types/PostWebsitesGymLogs";
import type { GetWebsitesGymWorkoutsIdLast200 as LastPerformance } from "../gen/types/GetWebsitesGymWorkoutsIdLast";
import { uuid, localDateISO } from "../lib/format";

export interface SetEntry {
  weight: number;
  reps: number;
  duration: number;
  done: boolean;
  /**
   * Saltada (fica por fazer — NUNCA `done`). Serve só para sair da sequência
   * (não voltar a ser pedida); não conta como concluída e não entra no log
   * (overhaul do ecrã de treino, `.design/workout-exec-overhaul/`).
   */
  skipped?: boolean;
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
  /**
   * UUID gerado no telemóvel no `start()` e incluído no `buildLog()` — a API
   * faz dedupe por `(customerId, clientUuid)`, por isso qualquer retry
   * (timeout, fila offline) é seguro: nunca cria um log duplicado.
   */
  clientUuid: string | null;
  currentIndex: number;
  /**
   * Série SELECIONADA por exercício (índice) — a que se vê/edita nos steppers.
   * Por omissão acompanha a série ATUAL da sequência (1.ª `!done && !skipped`,
   * derivada on-the-fly, não guardada); só muda quando o utilizador clica num
   * botão de série (não avança a sequência nem altera done/skipped).
   */
  selectedSet: number[];
  exercises: ActiveExercise[];
  /** Descanso/pausa em curso (null = a treinar). Persistido. */
  rest: RestState | null;
  start: (w: Workout, last?: LastPerformance | null) => void;
  setIndex: (i: number) => void;
  setSelectedSet: (exIdx: number, setIdx: number) => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<SetEntry>) => void;
  setDone: (exIdx: number, setIdx: number, done: boolean) => void;
  /** Conclui a série e avança para a próxima série/exercício. */
  advanceAfterSet: (exIdx: number, setIdx: number) => void;
  /**
   * Salta a série (fica por fazer, `skipped:true`, NUNCA `done`) — cancela o
   * descanso e avança a sequência para a próxima `!done && !skipped` (ou para
   * o próximo exercício, se este ficou terminado).
   */
  skipSet: (exIdx: number, setIdx: number) => void;
  /**
   * Salta o exercício: marca as séries pendentes (`!done && !skipped`) como
   * `skipped` (as já `done` mantêm-se) e passa ao próximo exercício (ou fica
   * no último, se não houver mais).
   */
  skipExercise: (exIdx: number) => void;
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
 * Depois de marcar uma série `done` ou `skipped`, avança a SEQUÊNCIA: para a
 * próxima série pendente (`!done && !skipped`) do mesmo exercício, ou para o
 * próximo exercício se este ficou terminado (todas `done || skipped`). O
 * `selectedSet` (vista) acompanha sempre a nova posição atual — mesmo que o
 * utilizador estivesse a ver outra série (decisão do brief: a vista "re-foca"
 * quando a sequência avança).
 */
function advanceSequence(
  exercises: ActiveExercise[],
  exIdx: number,
  selectedSet: number[],
): Partial<ActiveWorkoutState> {
  const exer = exercises[exIdx];
  const finished = exer.sets.every((st) => st.done || st.skipped);
  const patch: Partial<ActiveWorkoutState> = { exercises, rest: null };

  if (finished) {
    const nextIdx = Math.min(exIdx + 1, exercises.length - 1);
    patch.currentIndex = nextIdx;
    if (nextIdx !== exIdx) {
      const nextEx = exercises[nextIdx];
      const np = nextEx.sets.findIndex((st) => !st.done && !st.skipped);
      const sel = [...selectedSet];
      sel[nextIdx] = np === -1 ? 0 : np;
      patch.selectedSet = sel;
    }
  } else {
    const np = exer.sets.findIndex((st) => !st.done && !st.skipped);
    if (np !== -1) {
      const sel = [...selectedSet];
      sel[exIdx] = np;
      patch.selectedSet = sel;
    }
  }
  return patch;
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
  const isTime = ex.type === "time";
  const rest = ex.rest || 60;
  return Array.from({ length: count }, (_, j) => {
    const src = prev && prev.length > 0 ? prev[Math.min(j, prev.length - 1)] : null;
    return {
      weight: src ? src.weight : ex.weight,
      reps: src ? src.reps : ex.reps,
      // TODO(spec): `duration` ainda não existe nos sets de /workouts/:id/last no spec.
      duration: isTime ? (ex.duration ?? 0) : ((src as any)?.duration ?? 0),
      done: false,
      rest,
      lastWeight: src ? src.weight : null,
      lastReps: src ? src.reps : null,
      // TODO(spec): idem — `duration` fora do spec da última sessão.
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
  // TODO(spec): `mode`/`setRows` ainda não existem no spec.gym.json (drift do
  // swagger — outro agente está a atualizá-lo); até lá lêem-se via cast.
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
        // TODO(spec): `duration` fora do spec da última sessão.
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
      clientUuid: null,
      currentIndex: 0,
      selectedSet: [],
      exercises: [],
      rest: null,

      start: (w, last) =>
        set({
          workoutId: w.id,
          name: w.name,
          startedAt: Date.now(),
          // Gerado UMA vez por sessão de treino — todos os envios (incl. retries
          // da fila offline) usam o mesmo, e a API dedupa por ele.
          clientUuid: uuid(),
          currentIndex: 0,
          selectedSet: w.exercises.map(() => 0),
          rest: null,
          exercises: w.exercises.map((e) => ({
            exerciseId: e.exerciseId ?? null,
            name: e.name,
            group: e.group,
            type: e.type === "time" ? "time" : "strength",
            rest: e.rest || 60,
            mediaUrl: e.mediaUrl ?? null,
            targetReps: e.reps,
            targetWeight: e.weight,
            targetDuration: e.duration ?? 0,
            sets: buildSets(e, last),
          })),
        }),

      setIndex: (i) => set({ currentIndex: i }),

      setSelectedSet: (exIdx, setIdx) =>
        set((s) => {
          const selectedSet = [...s.selectedSet];
          selectedSet[exIdx] = setIdx;
          return { selectedSet };
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
          return advanceSequence(exercises, exIdx, s.selectedSet);
        }),

      skipSet: (exIdx, setIdx) =>
        set((s) => {
          const exercises = s.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st, j) => (j === setIdx ? { ...st, skipped: true } : st)) },
          );
          return advanceSequence(exercises, exIdx, s.selectedSet);
        }),

      skipExercise: (exIdx) =>
        set((s) => {
          const exercises = s.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st) => (st.done || st.skipped ? st : { ...st, skipped: true })) },
          );
          return advanceSequence(exercises, exIdx, s.selectedSet);
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
          // Data LOCAL explícita — sem ela a API usa o default UTC do servidor,
          // que na janela 00:00–01:00 (verão PT) carimba o dia anterior.
          date: localDateISO(),
          // Idempotência: a API dedupa por (customerId, clientUuid) — retries e
          // a fila offline nunca criam duplicados.
          clientUuid: s.clientUuid ?? undefined,
          durationMin,
          totalSets: s.doneSets(),
          entries: s.exercises.map((e) => ({
            exerciseName: e.name,
            group: e.group,
            // Séries saltadas ficam por fazer — nunca entram no log (overhaul do ecrã de treino).
            sets: e.sets
              .filter((st) => !st.skipped)
              .map((st) => ({ weight: st.weight, reps: st.reps, duration: st.duration, done: st.done })),
          })),
        };
      },

      clear: () =>
        set({
          workoutId: null,
          name: "",
          startedAt: null,
          clientUuid: null,
          currentIndex: 0,
          selectedSet: [],
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
      // v2: `activeSet` foi renomeado para `selectedSet` (overhaul do ecrã de
      // treino, brief §3 — passou a existir uma posição SELECIONADA distinta da
      // ATUAL). Sem esta migração explícita, um treino em curso persistido numa
      // versão anterior perdia o `activeSet` gravado (o merge do zustand só o
      // reaproveitava por sorte via o default `?? currentSetIdx`).
      // v3: `clientUuid` (idempotência do POST /logs). Um treino em curso
      // persistido por uma versão anterior ganha um uuid na migração — assim o
      // log desse treino já sai dedupável.
      version: 3,
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted?.rest && typeof persisted.rest.endsAt !== "number") {
          const remaining = typeof persisted.rest.remaining === "number" ? persisted.rest.remaining : 0;
          persisted.rest = { ...persisted.rest, endsAt: Date.now() + Math.max(0, remaining) * 1000 };
          delete persisted.rest.remaining;
        }
        if (version < 2 && persisted && "activeSet" in persisted) {
          if (persisted.selectedSet === undefined) persisted.selectedSet = persisted.activeSet;
          delete persisted.activeSet;
        }
        if (version < 3 && persisted && persisted.workoutId && !persisted.clientUuid) {
          persisted.clientUuid = uuid();
        }
        return persisted;
      },
    },
  ),
);

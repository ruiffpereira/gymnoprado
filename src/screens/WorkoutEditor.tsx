import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, ArrowUp, ArrowDown, Check, Dumbbell } from "lucide-react";
import { useCatalog, createWorkout, updateWorkout } from "../api";
import type { GymCatalogExercise, GymExerciseInput } from "../api";
import { useFindWorkout, useInvalidateGym } from "../hooks/useGym";
import { Button, Input, Modal, Stepper, GroupChip, Spinner, Tabs } from "../components/ui";
import { WEEKDAYS_SHORT, MUSCLE_GROUPS, groupColor } from "../lib/exercises";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";
import { useCms } from "../context/CmsContext";

/**
 * Rascunho de um exercício no editor. Além dos 4 escalares editáveis
 * (sets/reps/weight/rest), faz ROUND-TRIP de tudo o que o editor não edita —
 * o PATCH substitui o array `exercises` por inteiro, por isso qualquer campo
 * que não voltasse aqui era destruído em silêncio ao guardar (`type:"time"`
 * virava força, dropsets perdiam os `setRows`, notas do coach e media sumiam).
 */
interface Draft {
  exerciseId: string | null;
  name: string;
  group: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  // Preservados (não editáveis aqui) — devolvidos intactos no guardar.
  type?: "strength" | "time";
  duration?: number | null;
  notes?: string | null;
  mediaUrl?: string | null;
  // Round-trip tipado (spec.gym.json atualizado): o editor não edita estes
  // campos, mas preserva-os intactos no PATCH.
  mode?: GymExerciseInput["mode"];
  setRows?: GymExerciseInput["setRows"];
  subGroup?: string | null;
  media?: GymExerciseInput["media"];
  /**
   * O utilizador mexeu nos steppers desta linha. Num exercício série-a-série
   * (`mode:"perSet"`), editar os escalares converte-o para uniforme (os
   * escalares passam a mandar); sem toque, `mode`/`setRows` seguem intactos.
   * Marcado APENAS se o valor final ≠ valor inicial (snapshot ao carregar).
   */
  scalarsTouched?: boolean;
  // Snapshot dos valores iniciais para detetar mudanças reais (não apenas toque+volta).
  _initialSets?: number;
  _initialReps?: number;
  _initialWeight?: number;
  _initialRest?: number;
}

export function WorkoutEditor() {
  const { id, programId } = useParams();
  const navigate = useNavigate();
  const { t } = useCms();
  const invalidate = useInvalidateGym();
  const editing = !!id;
  const { workout, isLoading } = useFindWorkout(id);
  const { data: catalogData } = useCatalog({});
  const catalog = (catalogData ?? []) as GymCatalogExercise[];

  const [name, setName] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [rows, setRows] = useState<Draft[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const seededId = useRef<string | null>(null);

  // Seed do form — UMA VEZ por id de treino. Refetch em background não limpa
  // edições não guardadas (um refetch antigo mudava a ordem do `rows` de maneira
  // subtil, mas agora está imune porque só semeia uma vez).
  useEffect(() => {
    if (workout && seededId.current !== workout.id) {
      seededId.current = workout.id;
      setName(workout.name);
      setDays(workout.daysOfWeek ?? []);
      setRows(workout.exercises.map((e) => ({
        exerciseId: e.exerciseId ?? null, name: e.name, group: e.group,
        sets: e.sets, reps: e.reps, weight: e.weight ?? 0, rest: e.rest ?? 60,
        // Round-trip: o PATCH substitui `exercises` por inteiro — preservar
        // tudo o que este editor não edita.
        type: e.type, duration: e.duration ?? null, notes: e.notes ?? null, mediaUrl: e.mediaUrl ?? null,
        mode: e.mode, setRows: e.setRows, subGroup: e.subGroup ?? null,
        media: e.media,
        // Snapshot dos valores iniciais para detetar mudanças reais.
        _initialSets: e.sets,
        _initialReps: e.reps,
        _initialWeight: e.weight ?? 0,
        _initialRest: e.rest ?? 60,
      })));
    }
  }, [workout]);

  /**
   * Constrói o payload de um exercício a partir do rascunho. Decisão (#20):
   * num exercício série-a-série, mexer nos steppers converte-o para uniforme
   * (`mode:"uniform"`, sem `setRows` — os escalares mandam); sem toque,
   * `mode`/`setRows` passam intactos.
   */
  const toExerciseInput = (row: Draft): GymExerciseInput => {
    const perSetDropped = row.scalarsTouched && row.mode === "perSet";
    const base = {
      exerciseId: row.exerciseId,
      name: row.name,
      group: row.group,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      rest: row.rest,
      type: row.type,
      duration: row.duration,
      notes: row.notes,
      mediaUrl: row.mediaUrl,
      mode: perSetDropped ? "uniform" : row.mode,
      setRows: perSetDropped ? undefined : row.setRows,
      subGroup: row.subGroup,
      media: row.media,
    };
    return base as GymExerciseInput;
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), daysOfWeek: days, exercises: rows.map(toExerciseInput) };
      if (editing && id) return updateWorkout(id, payload);
      return createWorkout(programId!, payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? t("gym.app.editor.updated") : t("gym.app.editor.created"));
      navigate("/treinos");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const addExercise = (ex: GymCatalogExercise) => {
    setRows((r) => [...r, { exerciseId: ex.exerciseId, name: ex.name, group: ex.group, sets: 3, reps: 10, weight: 0, rest: 60, mediaUrl: ex.mediaUrl ?? null, _initialSets: 3, _initialReps: 10, _initialWeight: 0, _initialRest: 60 }]);
    setPickerOpen(false);
  };
  // Só chamado pelos steppers (sets/reps/weight/rest) → marca a linha como
  // "escalares tocados" APENAS se o valor final ≠ valor inicial (num perSet,
  // converte para uniforme ao guardar — ver Draft). Tocar +/− e voltar ao
  // original não marca.
  const update = (i: number, patch: Partial<Draft>) =>
    setRows((r) =>
      r.map((row, idx) => {
        if (idx !== i) return row;
        const newRow = { ...row, ...patch };
        // Marca `scalarsTouched` apenas se algum escalar mudou do initial.
        const setsTouched = newRow.sets !== row._initialSets;
        const repsTouched = newRow.reps !== row._initialReps;
        const weightTouched = newRow.weight !== row._initialWeight;
        const restTouched = newRow.rest !== row._initialRest;
        const changed = setsTouched || repsTouched || weightTouched || restTouched;
        return { ...newRow, scalarsTouched: changed ? true : newRow.scalarsTouched };
      }),
    );
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => setRows((r) => {
    const j = i + dir;
    if (j < 0 || j >= r.length) return r;
    const copy = [...r];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });
  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()));

  if (editing && isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;

  const filtered = filter === "all" ? catalog : catalog.filter((c) => c.group === filter);
  const canSave = name.trim().length > 0 && rows.length > 0;

  return (
    <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto animate-fadeIn pb-10">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center"><ChevronLeft size={18} className="text-t2" /></button>
        <h1 className="text-xl font-black text-t1 flex-1">{editing ? t("gym.app.editor.edit_title") : t("gym.app.editor.new_title")}</h1>
        <Button disabled={!canSave || save.isPending} icon={<Check size={16} />} onClick={() => save.mutate()}>
          {save.isPending ? t("gym.app.common.saving") : t("gym.app.common.save")}
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        <Input label={t("gym.app.editor.name_label")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("gym.app.editor.name_ph")} />

        <div>
          <p className="text-[13px] font-semibold text-t2 mb-2">{t("gym.app.editor.days")}</p>
          <div className="flex gap-1.5">
            {WEEKDAYS_SHORT.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${days.includes(i) ? "bg-brand text-white" : "bg-surface text-t3"}`}>
                {t(`gym.app.calendar.day.short.${["sun", "mon", "tue", "wed", "thu", "fri", "sat"][i]}`) || d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-t2">{t("gym.app.editor.exercises")} ({rows.length})</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {rows.map((row, i) => (
              <div key={i} className="rounded-card bg-surface shadow-card p-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${groupColor(row.group)}1A`, color: groupColor(row.group) }}>
                    <Dumbbell size={14} />
                  </span>
                  <span className="font-semibold text-t1 flex-1 truncate">{row.name}</span>
                  <GroupChip group={row.group} />
                  <button onClick={() => move(i, -1)} className="text-t3 p-1"><ArrowUp size={15} /></button>
                  <button onClick={() => move(i, 1)} className="text-t3 p-1"><ArrowDown size={15} /></button>
                  <button onClick={() => removeRow(i)} className="text-red p-1"><Trash2 size={15} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Field label={t("gym.app.editor.field_sets")}><Stepper value={row.sets} onChange={(v) => update(i, { sets: v })} min={1} /></Field>
                  <Field label={t("gym.app.editor.field_reps")}><Stepper value={row.reps} onChange={(v) => update(i, { reps: v })} /></Field>
                  <Field label={t("gym.app.editor.field_weight")}><Stepper value={row.weight} step={2.5} onChange={(v) => update(i, { weight: v })} suffix="kg" /></Field>
                  <Field label={t("gym.app.editor.field_rest")}><Stepper value={row.rest} step={15} onChange={(v) => update(i, { rest: v })} suffix="s" /></Field>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setPickerOpen(true)} className="mt-3 w-full rounded-card border-2 border-dashed border-line text-t2 flex items-center justify-center gap-2 py-4 hover:border-brand hover:text-brand transition-colors">
            <Plus size={18} /> {t("gym.app.editor.add_exercise")}
          </button>
        </div>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={t("gym.app.editor.add_exercise")}>
        <div className="mb-3">
          <Tabs<string>
            active={filter}
            onChange={setFilter}
            tabs={[{ id: "all", label: t("gym.app.editor.all") }, ...MUSCLE_GROUPS.slice(0, 3).map((g) => ({ id: g, label: g }))]}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {MUSCLE_GROUPS.map((g) => (
            <button key={g} onClick={() => setFilter(g)} className={`px-2.5 py-1 rounded-pill text-[11px] font-bold ${filter === g ? "ring-2 ring-brand" : ""}`} style={{ background: `${groupColor(g)}22`, color: groupColor(g) }}>{g}</button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 && <p className="text-sm text-t3 py-4 text-center">{t("gym.app.editor.empty_catalog")}</p>}
          {filtered.map((ex) => (
            <button key={ex.exerciseId} onClick={() => addExercise(ex)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg text-left transition-colors">
              <span className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center shrink-0 overflow-hidden">
                {ex.mediaUrl ? <img src={ex.mediaUrl} alt="" className="w-full h-full object-cover" /> : <Dumbbell size={16} className="text-t3" />}
              </span>
              <span className="flex-1 font-medium text-sm text-t1">{ex.name}</span>
              <GroupChip group={ex.group} />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-medium text-t3">{label}</span>
      {children}
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "../lib/toast";
import { ChevronDown, Lock, Plus, Play, Copy, Pencil, Trash2, Dumbbell } from "lucide-react";
import { usePrograms, createProgram, deleteProgram, deleteWorkout, cloneWorkout } from "../api";
import type { GymProgram, GymWorkout } from "../api";
import { useInvalidateGym } from "../hooks/useGym";
import { apiErrorMessage } from "../api/client";
import { Card, Button, Tabs, Modal, Input, GroupChip, Empty, Spinner } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { useCms } from "../context/CmsContext";

type TabId = "coach" | "meus";

function WorkoutCard({ workout, readOnly, clientPrograms, onChanged }: {
  workout: GymWorkout;
  readOnly: boolean;
  clientPrograms: GymProgram[];
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useCms();
  const [cloneOpen, setCloneOpen] = useState(false);
  // Apagar um treino a partir da LISTA tem a mesma confirmação que o detalhe já
  // tinha — era o único sítio onde um toque apagava sem perguntar.
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remove = useMutation({
    mutationFn: () => deleteWorkout(workout.id),
    onSuccess: () => { setConfirmDelete(false); onChanged(); toast.success(t("gym.app.workouts.deleted")); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const clone = useMutation({
    mutationFn: (targetProgramId: string) => cloneWorkout(workout.id, { targetProgramId }),
    onSuccess: () => { onChanged(); setCloneOpen(false); toast.success(t("gym.app.workouts.cloned")); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const doClone = () => {
    if (clone.isPending) return; // double-tap = 2 cópias
    if (clientPrograms.length === 0) { toast.error(t("gym.app.workouts.clone_need_group")); return; }
    if (clientPrograms.length === 1) clone.mutate(clientPrograms[0].id);
    else setCloneOpen(true);
  };

  return (
    <Card className="p-0">
      <div className="h-1" style={{ background: readOnly ? "var(--t3)" : "var(--green)" }} />
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-lt flex items-center justify-center shrink-0">
            <Dumbbell size={16} className="text-brand-dk" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-t1 truncate">{workout.name}</p>
              {readOnly && <Lock size={13} className="text-t3 shrink-0" />}
            </div>
            <p className="text-xs text-t3">{workout.exercises.length} {t("gym.app.common.exercises")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2.5">
          {(workout.muscleGroups ?? []).map((g) => <GroupChip key={g} group={g} />)}
        </div>

        <ul className="text-xs text-t2 space-y-0.5 mb-3">
          {workout.exercises.slice(0, 3).map((e) => (
            <li key={e.id} className="truncate">{e.name} · {e.sets}×{e.reps}</li>
          ))}
          {workout.exercises.length > 3 && <li className="text-t3">+{workout.exercises.length - 3} {t("gym.app.common.more")}</li>}
        </ul>

        <div className="flex items-center gap-1.5">
          <Button size="sm" icon={<Play size={15} fill="currentColor" />} onClick={() => navigate(`/treino/${workout.id}`)}>{t("gym.app.workouts.view") || t("gym.app.common.start")}</Button>
          <Button size="sm" variant="greenLight" icon={<Copy size={15} />} disabled={clone.isPending} onClick={doClone}>{t("gym.app.workouts.clone")}</Button>
          {!readOnly && (
            <>
              <button onClick={() => navigate(`/treino/${workout.id}/editar`)} className="ml-auto w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-t2"><Pencil size={15} /></button>
              <button onClick={() => setConfirmDelete(true)} title={t("gym.app.detail.delete")} className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-red"><Trash2 size={15} /></button>
            </>
          )}
        </div>
      </div>

      <Modal open={cloneOpen} onClose={() => setCloneOpen(false)} title={t("gym.app.workouts.clone_to")}>
        <div className="flex flex-col gap-2">
          {clientPrograms.map((p) => (
            <button key={p.id} disabled={clone.isPending} onClick={() => { if (!clone.isPending) clone.mutate(p.id); }} className="text-left p-3 rounded-xl border border-line hover:border-brand transition-colors disabled:opacity-50">
              <span className="font-semibold text-t1">{p.name}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Confirmação de apagar treino — mesma confirmação do detalhe */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("gym.app.detail.delete_title")}>
        <div className="pt-1">
          <p className="text-[14px] text-t2 mb-5">{t("gym.app.detail.delete_confirm")}</p>
          <div className="flex flex-col gap-2.5">
            <Button fullWidth size="lg" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? t("gym.app.common.saving") : t("gym.app.detail.delete")}</Button>
            <Button fullWidth variant="ghost" onClick={() => setConfirmDelete(false)}>{t("gym.app.common.cancel")}</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function ProgramAccordion({ program, readOnly, clientPrograms, onChanged }: {
  program: GymProgram;
  readOnly: boolean;
  clientPrograms: GymProgram[];
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useCms();
  const [open, setOpen] = useState(true);
  // Apagar um grupo leva TODOS os treinos dentro dele — nunca sem confirmação.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteProgram(program.id),
    onSuccess: () => { setConfirmDelete(false); onChanged(); toast.success(t("gym.app.workouts.group_deleted")); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div>
      {/* Apagar é um botão IRMÃO do acordeão, nunca interativo aninhado (a11y). */}
      <div className="w-full flex items-center gap-2">
        <button onClick={() => setOpen((o) => !o)} className="flex-1 min-w-0 flex items-center gap-2 py-2 text-left">
          <ChevronDown size={18} className={`text-t3 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="font-bold text-t1">{program.name}</span>
          {readOnly && <Lock size={13} className="text-t3" />}
          <span className="text-xs text-t3">({program.workouts.length})</span>
        </button>
        {!readOnly && (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label={t("gym.app.workouts.group_delete_title") || "Apagar grupo"}
            className="shrink-0 text-t3 hover:text-red p-1 hit44"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Confirmação de apagar grupo (leva os treinos todos) */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("gym.app.workouts.group_delete_title") || "Apagar grupo?"}>
        <div className="pt-1">
          <p className="text-[14px] text-t2 mb-5">
            {t("gym.app.workouts.group_delete_confirm") || "Apaga o grupo e todos os treinos dentro dele. Esta ação não pode ser anulada."}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button fullWidth size="lg" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? t("gym.app.common.saving") : t("gym.app.detail.delete")}</Button>
            <Button fullWidth variant="ghost" onClick={() => setConfirmDelete(false)}>{t("gym.app.common.cancel")}</Button>
          </div>
        </div>
      </Modal>

      {open && (
        <div className="grid sm:grid-cols-2 gap-3 pb-3">
          {program.workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} readOnly={readOnly} clientPrograms={clientPrograms} onChanged={onChanged} />
          ))}
          {!readOnly && (
            <button onClick={() => navigate(`/programa/${program.id}/novo-treino`)} className="rounded-card border-2 border-dashed border-line text-t2 flex items-center justify-center gap-2 py-6 hover:border-brand hover:text-brand transition-colors">
              <Plus size={18} /> {t("gym.app.workouts.add_workout")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Workouts() {
  const { t } = useCms();
  const [tab, setTab] = useState<TabId>("coach");
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const { data, isLoading } = usePrograms();
  const invalidate = useInvalidateGym();

  const programs = (data ?? []) as GymProgram[];
  const coachPrograms = programs.filter((p) => p.owner === "coach");
  const clientPrograms = programs.filter((p) => p.owner === "client");

  const createGroup = useMutation({
    mutationFn: () => createProgram({ name: groupName.trim() }),
    onSuccess: () => { invalidate(); setNewGroupOpen(false); setGroupName(""); toast.success(t("gym.app.workouts.group_created")); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  useScreenHeader({ title: t("gym.app.nav.workouts") });

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;

  const list = tab === "coach" ? coachPrograms : clientPrograms;

  return (
    <div className="animate-fadeIn">
      <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Tabs<TabId>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "coach", label: <span className="flex items-center gap-1.5"><Lock size={14} /> {t("gym.app.workouts.tab_coach")}</span> },
            { id: "meus", label: t("gym.app.workouts.tab_mine") },
          ]}
        />
      </div>

      {tab === "coach" && coachPrograms.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-brand-xlt text-brand-dk text-xs flex items-center gap-2">
          <Lock size={14} /> {t("gym.app.workouts.coach_readonly_note")}
        </div>
      )}

      {tab === "meus" && (
        <div className="flex justify-end mb-3">
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setNewGroupOpen(true)}>{t("gym.app.workouts.new_group")}</Button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          title={tab === "coach" ? t("gym.app.workouts.empty_coach_title") : t("gym.app.workouts.empty_mine_title")}
          subtitle={tab === "coach" ? t("gym.app.workouts.empty_coach_sub") : t("gym.app.workouts.empty_mine_sub")}
          action={tab === "meus" ? <Button icon={<Plus size={16} />} onClick={() => setNewGroupOpen(true)}>{t("gym.app.workouts.new_group")}</Button> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-1">
          {list.map((p) => (
            <ProgramAccordion key={p.id} program={p} readOnly={tab === "coach"} clientPrograms={clientPrograms} onChanged={invalidate} />
          ))}
        </div>
      )}

      <Modal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        title={t("gym.app.workouts.new_group_modal")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewGroupOpen(false)}>{t("gym.app.common.cancel")}</Button>
            <Button disabled={!groupName.trim() || createGroup.isPending} onClick={() => createGroup.mutate()}>{t("gym.app.common.create")}</Button>
          </>
        }
      >
        <Input label={t("gym.app.workouts.group_name")} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t("gym.app.workouts.group_name_ph")} />
      </Modal>
      </div>
    </div>
  );
}

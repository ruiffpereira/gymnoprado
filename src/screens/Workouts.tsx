import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Lock, Play, Dumbbell } from "lucide-react";
import { usePrograms } from "../api";
import type { GymProgram, GymWorkout } from "../api";
import { Card, Button, GroupChip, Empty, Spinner } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { useCms } from "../context/CmsContext";

// B59 F2 (GY-68): o sócio só vê os planos — quem os cria e edita é o negócio, no Backoffice.

function WorkoutCard({ workout }: { workout: GymWorkout }) {
  const navigate = useNavigate();
  const { t } = useCms();

  return (
    <Card className="p-0">
      <div className="h-1" style={{ background: "var(--t3)" }} />
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-lt flex items-center justify-center shrink-0">
            <Dumbbell size={16} className="text-brand-dk" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-t1 truncate">{workout.name}</p>
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

        <Button size="sm" icon={<Play size={15} fill="currentColor" />} onClick={() => navigate(`/treino/${workout.id}`)}>{t("gym.app.workouts.view") || t("gym.app.common.start")}</Button>
      </div>
    </Card>
  );
}

function ProgramAccordion({ program }: { program: GymProgram }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 py-2 text-left">
        <ChevronDown size={18} className={`text-t3 transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="font-bold text-t1">{program.name}</span>
        <span className="text-xs text-t3">({program.workouts.length})</span>
      </button>
      {open && (
        <div className="grid sm:grid-cols-2 gap-3 pb-3">
          {program.workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)}
        </div>
      )}
    </div>
  );
}

export function Workouts() {
  const { t } = useCms();
  const { data, isLoading } = usePrograms();
  const programs = (data ?? []) as GymProgram[];

  useScreenHeader({ title: t("gym.app.nav.workouts") });

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="animate-fadeIn">
      <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto">
        {programs.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-brand-xlt text-brand-dk text-xs flex items-center gap-2">
            <Lock size={14} /> {t("gym.app.workouts.coach_readonly_note")}
          </div>
        )}

        {programs.length === 0 ? (
          <Empty
            title={t("gym.app.workouts.empty_coach_title")}
            subtitle={t("gym.app.workouts.empty_coach_sub")}
          />
        ) : (
          <div className="flex flex-col gap-1">
            {programs.map((p) => <ProgramAccordion key={p.id} program={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

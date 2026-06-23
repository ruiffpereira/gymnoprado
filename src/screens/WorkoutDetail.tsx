import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Lock, Pencil, Play, Dumbbell, Clock, Target, Layers } from "lucide-react";
import { useFindWorkout } from "../hooks/useGym";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { getLastPerformance } from "../api";
import { Button, GroupChip, Spinner } from "../components/ui";
import { useCms } from "../context/CmsContext";

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-brand">{icon}</span>
      <span className="font-black text-white text-lg tnum">{value}</span>
      <span className="text-white/50 text-[11px]">{label}</span>
    </div>
  );
}

export function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useCms();
  const { workout, program, isLoading } = useFindWorkout(id);
  const start = useActiveWorkout((s) => s.start);
  const [starting, setStarting] = useState(false);

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;
  if (!workout) {
    return (
      <div className="px-5 py-10 text-center text-t2">
        {t("gym.app.detail.not_found")} <button className="text-brand font-semibold" onClick={() => navigate("/treinos")}>{t("gym.app.common.back")}</button>
      </div>
    );
  }

  const readOnly = program?.owner === "coach";
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const estMin = Math.round(workout.exercises.reduce((a, e) => a + e.sets * (e.rest + 40), 0) / 60);

  const begin = async () => {
    if (starting) return;
    setStarting(true);
    // Pré-preenche com a última sessão (pesos/reps). Se falhar, arranca na mesma.
    let last = null;
    try {
      last = await getLastPerformance(workout.id);
    } catch {
      last = null;
    }
    start(workout, last);
    navigate(`/treino/${workout.id}/executar`);
  };

  return (
    <div className="pb-28 animate-fadeIn">
      {/* Hero */}
      <div className="relative bg-ink text-white px-5 lg:px-9 pt-6 pb-8 overflow-hidden">
        <div className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
            <ChevronLeft size={18} /> {t("gym.app.common.back")}
          </button>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-black">{workout.name}</h1>
            {readOnly && <Lock size={16} className="text-white/60" />}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {(workout.muscleGroups ?? []).map((g) => <GroupChip key={g} group={g} />)}
          </div>
          <div className="flex">
            <Metric icon={<Dumbbell size={18} />} value={workout.exercises.length} label={t("gym.app.common.exercises")} />
            <Metric icon={<Layers size={18} />} value={totalSets} label={t("gym.app.common.sets")} />
            <Metric icon={<Clock size={18} />} value={`~${estMin}`} label={t("gym.app.common.min")} />
            <Metric icon={<Target size={18} />} value={(workout.muscleGroups ?? []).length} label={t("gym.app.common.groups")} />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-5 lg:px-9 py-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-t1">{t("gym.app.detail.exercises_heading")}</h2>
          {!readOnly ? (
            <Button size="sm" variant="greenLight" icon={<Pencil size={15} />} onClick={() => navigate(`/treino/${workout.id}/editar`)}>{t("gym.app.common.edit")}</Button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-t3"><Lock size={13} /> {t("gym.app.detail.coach_plan")}</span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {workout.exercises.map((e, i) => (
            <div key={e.id} className="flex gap-3 p-3 rounded-card bg-surface shadow-card">
              <div className="w-14 h-14 rounded-xl bg-bg flex items-center justify-center shrink-0 overflow-hidden">
                {e.mediaUrl ? <img src={e.mediaUrl} alt={e.name} className="w-full h-full object-cover" /> : <Dumbbell size={20} className="text-t3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-t3">{i + 1}</span>
                  <span className="font-semibold text-t1 truncate">{e.name}</span>
                  <GroupChip group={e.group} />
                </div>
                <p className="text-xs text-t2 mb-1.5">{e.sets} {t("gym.app.common.sets")} · {e.reps} {t("gym.app.common.reps")} · {e.weight}kg · {e.rest}s {t("gym.app.common.rest")}</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: e.sets }).map((_, s) => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg text-t2">{e.reps} {t("gym.app.common.reps")} · {e.weight}kg</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 lg:left-[248px] z-30 bg-surface/90 backdrop-blur-xl border-t border-line p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 72px)" }}>
        <div className="max-w-3xl mx-auto">
          <Button size="lg" fullWidth disabled={starting} icon={<Play size={18} fill="currentColor" />} onClick={begin}>{starting ? t("gym.app.common.loading") : t("gym.app.dashboard.start")}</Button>
        </div>
      </div>
    </div>
  );
}

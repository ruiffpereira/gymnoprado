import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Lock, Pencil, Play, Dumbbell, Clock, Target, Layers } from "lucide-react";
import { useFindWorkout } from "../hooks/useGym";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { Button, GroupChip, Spinner } from "../components/ui";

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
  const { workout, program, isLoading } = useFindWorkout(id);
  const start = useActiveWorkout((s) => s.start);

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;
  if (!workout) {
    return (
      <div className="px-5 py-10 text-center text-t2">
        Treino não encontrado. <button className="text-brand font-semibold" onClick={() => navigate("/treinos")}>Voltar</button>
      </div>
    );
  }

  const readOnly = program?.owner === "coach";
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const estMin = Math.round(workout.exercises.reduce((a, e) => a + e.sets * (e.rest + 40), 0) / 60);

  const begin = () => {
    start(workout);
    navigate(`/treino/${workout.id}/executar`);
  };

  return (
    <div className="pb-28 animate-fadeIn">
      {/* Hero */}
      <div className="relative bg-ink text-white px-5 lg:px-9 pt-6 pb-8 overflow-hidden">
        <div className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
            <ChevronLeft size={18} /> Voltar
          </button>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-black">{workout.name}</h1>
            {readOnly && <Lock size={16} className="text-white/60" />}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {(workout.muscleGroups ?? []).map((g) => <GroupChip key={g} group={g} />)}
          </div>
          <div className="flex">
            <Metric icon={<Dumbbell size={18} />} value={workout.exercises.length} label="exercícios" />
            <Metric icon={<Layers size={18} />} value={totalSets} label="séries" />
            <Metric icon={<Clock size={18} />} value={`~${estMin}`} label="min" />
            <Metric icon={<Target size={18} />} value={(workout.muscleGroups ?? []).length} label="grupos" />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-5 lg:px-9 py-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-t1">Exercícios</h2>
          {!readOnly ? (
            <Button size="sm" variant="greenLight" icon={<Pencil size={15} />} onClick={() => navigate(`/treino/${workout.id}/editar`)}>Editar</Button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-t3"><Lock size={13} /> Plano do coach</span>
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
                <p className="text-xs text-t2 mb-1.5">{e.sets} séries · {e.reps} reps · {e.weight}kg · {e.rest}s descanso</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: e.sets }).map((_, s) => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg text-t2">{e.reps} reps · {e.weight}kg</span>
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
          <Button size="lg" fullWidth icon={<Play size={18} fill="currentColor" />} onClick={begin}>Começar Treino</Button>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Flame, Dumbbell, ChevronRight, Play } from "lucide-react";
import { usePrograms, useSummary, useLogs } from "../api";
import type { GymWorkout, GymLog } from "../api";
import { useAllWorkouts } from "../hooks/useGym";
import { useSession } from "../store/useSession";
import { Card, Button, ProgressRing, Avatar, Spinner } from "../components/ui";
import { greeting, relativeDays } from "../lib/format";
import { WEEKDAYS_SHORT } from "../lib/exercises";

const WEEKLY_GOAL = 5;

function todaysWorkout(workouts: GymWorkout[]): GymWorkout | undefined {
  const dow = new Date().getDay();
  return workouts.find((w) => (w.daysOfWeek ?? []).includes(dow)) ?? workouts[0];
}

export function Dashboard() {
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const { items, isLoading } = useAllWorkouts();
  const { data: summary } = useSummary();
  const { data: logsData } = useLogs({});
  usePrograms(); // garante prefetch partilhado

  const logs = (logsData ?? []) as GymLog[];
  const workouts = items.map((i) => i.workout);
  const today = todaysWorkout(workouts);

  // Pontos da semana (dias com treino)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // segunda
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const loggedDays = new Set(logs.map((l) => l.date));
  const weekCount = weekDates.filter((d) => loggedDays.has(d)).length;

  if (isLoading) {
    return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-t1">{greeting(profile?.name)}</h1>
          <p className="text-t2 text-sm">Pronto para treinar?</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-orange/10">
          <Flame size={16} className="text-orange" />
          <span className="font-bold text-orange text-sm tnum">{summary?.streak ?? 0}</span>
        </div>
        <Avatar name={profile?.name} size={40} />
      </div>

      {/* Hero — treino de hoje */}
      <div className="relative rounded-card bg-ink text-white p-6 overflow-hidden mb-5">
        <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-bold tracking-widest text-brand mb-1">TREINO DE HOJE</p>
          {today ? (
            <>
              <h2 className="text-2xl font-black mb-1">{today.name}</h2>
              <p className="text-white/60 text-sm mb-5">
                {today.exercises.length} exercícios · {today.exercises.reduce((a, e) => a + e.sets, 0)} séries
              </p>
              <Button variant="primary" icon={<Play size={18} fill="currentColor" />} onClick={() => navigate(`/treino/${today.id}`)}>
                Começar Treino
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-black mb-1">Sem treino agendado</h2>
              <p className="text-white/60 text-sm mb-5">Cria o teu primeiro treino para começar.</p>
              <Button variant="primary" onClick={() => navigate("/treinos")}>Ver treinos</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {/* Esta semana */}
        <Card className="p-5">
          <p className="text-sm font-bold text-t1 mb-3">Esta semana</p>
          <div className="flex justify-between mb-3">
            {weekDates.map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${loggedDays.has(d) ? "bg-brand text-white" : "bg-bg text-t3"}`}>
                  {WEEKDAYS_SHORT[(i + 1) % 7][0]}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-t2">{weekCount} treino{weekCount === 1 ? "" : "s"} esta semana</p>
        </Card>

        {/* Progresso */}
        <Card className="p-5 flex items-center gap-4">
          <ProgressRing value={weekCount} max={WEEKLY_GOAL} size={84} label={`${weekCount}/${WEEKLY_GOAL}`} sublabel="meta" />
          <div>
            <p className="text-sm font-bold text-t1">Meta semanal</p>
            <p className="text-xs text-t2 mt-0.5">{summary?.totalSets ?? 0} séries no total</p>
          </div>
        </Card>
      </div>

      {/* Últimos treinos */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-t1">Últimos Treinos</h3>
        <button onClick={() => navigate("/historico")} className="text-sm text-brand font-semibold flex items-center gap-0.5">
          Ver tudo <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {logs.slice(0, 3).map((l) => (
          <Card key={l.logId} className="p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-lt flex items-center justify-center">
              <Dumbbell size={18} className="text-brand-dk" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-t1 truncate">{l.workoutName}</p>
              <p className="text-xs text-t3">{relativeDays(l.date)} · {l.totalSets} séries</p>
            </div>
          </Card>
        ))}
        {logs.length === 0 && <p className="text-sm text-t3 py-4 text-center">Ainda não há treinos registados.</p>}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Flame, Dumbbell, ChevronRight, Play } from "lucide-react";
import { useSummary, useLogs } from "../api";
import type { GymLog } from "../api";
import { useActiveProgram } from "../hooks/useGym";
import { useSession } from "../store/useSession";
import { Card, Button, ProgressRing, Avatar, Spinner } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { greeting, relativeDays, localDateISO } from "../lib/format";
import { WEEKDAYS_SHORT } from "../lib/exercises";
import { useCms } from "../context/CmsContext";
import { MensalidadeBanner } from "../components/MensalidadeBanner";
import { PendingSyncBanner } from "../components/PendingSyncBanner";

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useCms();
  const profile = useSession((s) => s.profile);
  const { data: active, isLoading } = useActiveProgram();
  const { data: summary } = useSummary();
  const { data: logsData } = useLogs({});

  const logs = (logsData ?? []) as GymLog[];
  const program = active?.program ?? null;
  // Treino a fazer agora (regra do servidor); fallback ao 1.º do programa ativo.
  const today =
    program?.workouts.find((w) => w.id === active?.nextWorkoutId) ?? program?.workouts[0];
  const weeklyGoal = active && active.weeklyGoal > 0 ? active.weeklyGoal : 5;

  // Pontos da semana (dias com treino)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // segunda
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return localDateISO(d);
  });
  const loggedDays = new Set(logs.map((l) => l.date));
  const weekCount = weekDates.filter((d) => loggedDays.has(d)).length;

  useScreenHeader({
    title: greeting(profile?.name),
    subtitle: t("gym.app.dashboard.subtitle"),
    right: (
      <>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-white/20 dark:bg-orange/10">
          <Flame size={16} className="text-white dark:text-orange" />
          <span className="font-bold text-white dark:text-orange text-sm tnum">{summary?.streak ?? 0}</span>
        </div>
        <Avatar name={profile?.name} size={40} />
      </>
    ),
  });

  if (isLoading) {
    return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto">
      {/* Treinos guardados no telemóvel à espera de rede (fila offline) */}
      <PendingSyncBanner />
      {/* Aviso de mensalidade por pagar / em atraso (some quando paga) */}
      <MensalidadeBanner />
      {/* Hero — treino de hoje */}
      <div className="relative rounded-card overflow-hidden mb-5 p-6 text-white bg-ink dark:bg-gradient-to-br dark:from-[#26391c] dark:via-[#13200d] dark:to-[#0b1207] shadow-lg">
        <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-brand/30 dark:bg-brand/45 blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-bold tracking-widest text-brand mb-1">{t("gym.app.dashboard.today_label")}</p>
          {today ? (
            <>
              <h2 className="text-2xl font-black mb-1">{today.name}</h2>
              <p className="text-white/60 text-sm mb-5">
                {today.exercises.length} {t("gym.app.common.exercises")} · {today.exercises.reduce((a, e) => a + e.sets, 0)} {t("gym.app.common.sets")}
              </p>
              <Button variant="primary" icon={<Play size={18} fill="currentColor" />} onClick={() => navigate(`/treino/${today.id}`)}>
                {t("gym.app.dashboard.start")}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-black mb-1">{t("gym.app.dashboard.no_workout_title")}</h2>
              <p className="text-white/60 text-sm mb-5">{t("gym.app.dashboard.no_workout_desc")}</p>
              <Button variant="primary" onClick={() => navigate("/treinos")}>{t("gym.app.dashboard.see_workouts")}</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {/* Esta semana */}
        <Card className="p-5">
          <p className="text-sm font-bold text-t1 mb-3">{t("gym.app.dashboard.this_week")}</p>
          <div className="flex justify-between mb-3">
            {weekDates.map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${loggedDays.has(d) ? "bg-brand text-white" : "bg-bg text-t3"}`}>
                  {WEEKDAYS_SHORT[(i + 1) % 7]}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-t2">{weekCount} {t("gym.app.common.workouts")} {t("gym.app.dashboard.week_suffix")}</p>
        </Card>

        {/* Progresso */}
        <Card className="p-5 flex items-center gap-4">
          <ProgressRing value={weekCount} max={weeklyGoal} size={84} label={`${weekCount}/${weeklyGoal}`} sublabel={t("gym.app.dashboard.goal_label")} />
          <div>
            <p className="text-sm font-bold text-t1">{t("gym.app.dashboard.weekly_goal")}</p>
            <p className="text-xs text-t2 mt-0.5">{summary?.totalSets ?? 0} {t("gym.app.dashboard.total_sets")}</p>
          </div>
        </Card>
      </div>

      {/* Últimos treinos */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-t1">{t("gym.app.dashboard.recent")}</h3>
        <button onClick={() => navigate("/historico")} className="text-sm text-brand font-semibold flex items-center gap-0.5">
          {t("gym.app.common.see_all")} <ChevronRight size={16} />
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
              <p className="text-xs text-t3">{relativeDays(l.date)} · {l.totalSets} {t("gym.app.common.sets")}</p>
            </div>
          </Card>
        ))}
        {logs.length === 0 && <p className="text-sm text-t3 py-4 text-center">{t("gym.app.dashboard.no_logs")}</p>}
      </div>
      </div>
    </div>
  );
}

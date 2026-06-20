import { Dumbbell, Flame, Layers, TrendingUp } from "lucide-react";
import { useSummary, useWeekly, useRecords } from "../api";
import type { GymWeeklyPoint, GymRecord } from "../api";
import { Card, Spinner } from "../components/ui";
import { groupColor } from "../lib/exercises";
import { format } from "date-fns";

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="p-4">
      <span className="inline-flex text-brand mb-2">{icon}</span>
      <p className="text-2xl font-black text-t1 tnum">{value}</p>
      <p className="text-xs text-t2 mt-0.5">{label}</p>
    </Card>
  );
}

export function Progress() {
  const { data: summary, isLoading } = useSummary();
  const { data: weeklyData } = useWeekly();
  const { data: recordsData } = useRecords();
  const weekly = (weeklyData ?? []) as GymWeeklyPoint[];
  const records = (recordsData ?? []) as GymRecord[];

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;

  const maxWeek = Math.max(1, ...weekly.map((w) => w.count));
  const currentKey = weekly.length ? weekly[weekly.length - 1].weekStart : "";

  // Foco muscular a partir dos recordes (distribuição simples por grupo)
  const focus = new Map<string, number>();
  for (const r of records) {
    if (r.group) focus.set(r.group, (focus.get(r.group) ?? 0) + 1);
  }
  const focusTotal = [...focus.values()].reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto animate-fadeIn">
      <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-t1 mb-4">Progresso</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Dumbbell size={20} />} value={summary?.totalWorkouts ?? 0} label="Treinos totais" />
        <StatCard icon={<Flame size={20} />} value={summary?.streak ?? 0} label="Dias de streak" />
        <StatCard icon={<Layers size={20} />} value={summary?.totalSets ?? 0} label="Séries feitas" />
        <StatCard icon={<TrendingUp size={20} />} value={summary?.avgPerWeek ?? 0} label="Treinos/semana" />
      </div>

      <Card className="p-5 mb-5">
        <h3 className="font-bold text-t1 mb-4">Treinos por Semana</h3>
        <div className="flex items-end gap-2 h-32">
          {weekly.map((w) => {
            const active = w.weekStart === currentKey;
            return (
              <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-full rounded-t-md transition-all ${active ? "bg-brand" : "bg-brand/30"}`} style={{ height: `${(w.count / maxWeek) * 100}%`, minHeight: 3 }} />
                <span className="text-[9px] text-t3">{format(new Date(w.weekStart), "d/M")}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-t1 mb-4">Recordes Pessoais</h3>
          {records.length === 0 ? (
            <p className="text-sm text-t3">Sem recordes ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {records.map((r, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: groupColor(r.group) }} />
                  <span className="text-sm text-t1 flex-1 truncate">{r.exerciseName}</span>
                  <span className="font-bold text-t1 tnum">{r.weight} kg</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-t1 mb-4">Foco Muscular</h3>
          {focus.size === 0 ? (
            <p className="text-sm text-t3">Sem dados suficientes.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {[...focus.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => (
                <div key={g}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-t1">{g}</span>
                    <span className="text-t3 tnum">{Math.round((n / focusTotal) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(n / focusTotal) * 100}%`, background: groupColor(g) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

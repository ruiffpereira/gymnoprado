import { useState } from "react";
import { Dumbbell, Flame, Layers, TrendingUp } from "lucide-react";
import { useSummary, useLoadSeries, useRecords } from "../api";
import type { GymLoadSeries, GymRecord } from "../api";
import { Card, Spinner } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { useCms } from "../context/CmsContext";
import { groupColor } from "../lib/exercises";
import { format } from "date-fns";

/** Gráfico de linha simples (SVG) da carga ao longo das sessões. */
function LoadChart({ points, color }: { points: { date: string; weight: number }[]; color: string }) {
  const W = 320, H = 150, padX = 10, padY = 16;
  const ws = points.map((p) => p.weight);
  const min = Math.min(...ws), max = Math.max(...ws);
  const span = max - min || 1;
  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - 2 * padX));
  const y = (w: number) => padY + (1 - (w - min) / span) * (H - 2 * padY);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - padY} L${x(0).toFixed(1)},${H - padY} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#loadFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.weight)} r="3.5" fill={color} />)}
    </svg>
  );
}

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
  const { t } = useCms();
  const { data: summary, isLoading } = useSummary();
  const { data: loadData } = useLoadSeries();
  const { data: recordsData } = useRecords();
  const series = (loadData ?? []) as GymLoadSeries;
  const records = (recordsData ?? []) as GymRecord[];
  const [selEx, setSelEx] = useState<string>("");

  useScreenHeader({ title: t("gym.app.nav.progress") });

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;

  const selected = series.find((s) => s.exerciseName === selEx) ?? series[0];
  const pts = selected?.points ?? [];
  const lastW = pts.length ? pts[pts.length - 1].weight : 0;
  const delta = pts.length >= 2 ? Math.round((lastW - pts[0].weight) * 10) / 10 : null;

  // Foco muscular a partir dos recordes (distribuição simples por grupo)
  const focus = new Map<string, number>();
  for (const r of records) {
    if (r.group) focus.set(r.group, (focus.get(r.group) ?? 0) + 1);
  }
  const focusTotal = [...focus.values()].reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="animate-fadeIn">
      <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Dumbbell size={20} />} value={summary?.totalWorkouts ?? 0} label={t("gym.app.progress.total_workouts")} />
        <StatCard icon={<Flame size={20} />} value={summary?.streak ?? 0} label={t("gym.app.progress.streak_days")} />
        <StatCard icon={<Layers size={20} />} value={summary?.totalSets ?? 0} label={t("gym.app.progress.total_sets")} />
        <StatCard icon={<TrendingUp size={20} />} value={summary?.avgPerWeek ?? 0} label={t("gym.app.progress.per_week")} />
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-t1">{t("gym.app.progress.load_chart")}</h3>
          {series.length > 0 && (
            <select value={selected?.exerciseName ?? ""} onChange={(e) => setSelEx(e.target.value)}
              className="text-[13px] font-semibold bg-bg rounded-lg px-2.5 py-1.5 text-t1 max-w-[55%] truncate outline-none border border-line">
              {series.map((s) => <option key={s.exerciseName} value={s.exerciseName}>{s.exerciseName}</option>)}
            </select>
          )}
        </div>
        {selected && pts.length >= 2 ? (
          <>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-t1 tnum">{lastW} kg</span>
              {delta != null && <span className={`text-[12px] font-bold ${delta >= 0 ? "text-brand-dk" : "text-red"}`}>{delta >= 0 ? "+" : ""}{delta} kg</span>}
            </div>
            <LoadChart points={pts} color={groupColor(selected.group)} />
            <div className="flex justify-between text-[10px] text-t3 mt-1">
              <span>{format(new Date(pts[0].date), "d/M")}</span>
              <span>{format(new Date(pts[pts.length - 1].date), "d/M")}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-t3 py-10 text-center">{t("gym.app.progress.load_empty")}</p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-t1 mb-4">{t("gym.app.progress.records")}</h3>
          {records.length === 0 ? (
            <p className="text-sm text-t3">{t("gym.app.progress.no_records")}</p>
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
          <h3 className="font-bold text-t1 mb-4">{t("gym.app.progress.muscle_focus")}</h3>
          {focus.size === 0 ? (
            <p className="text-sm text-t3">{t("gym.app.progress.no_data")}</p>
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
    </div>
  );
}

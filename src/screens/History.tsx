import { useNavigate } from "react-router-dom";
import { Dumbbell, Repeat, Flame, Layers } from "lucide-react";
import { useLogs, useSummary } from "../api";
import type { GymLog } from "../api";
import { Card, Spinner, Empty } from "../components/ui";
import { relativeDays } from "../lib/format";
import { startOfWeek, format } from "date-fns";
import { pt } from "date-fns/locale";

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="p-3.5 flex-1 text-center">
      <span className="inline-flex text-brand mb-1">{icon}</span>
      <p className="text-xl font-black text-t1 tnum">{value}</p>
      <p className="text-[11px] text-t3">{label}</p>
    </Card>
  );
}

export function History() {
  const navigate = useNavigate();
  const { data, isLoading } = useLogs({});
  const { data: summary } = useSummary();
  const logs = (data ?? []) as GymLog[];

  if (isLoading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8" /></div>;

  // Agrupar por semana
  const groups = new Map<string, GymLog[]>();
  for (const l of logs) {
    const wk = startOfWeek(new Date(l.date), { weekStartsOn: 1 });
    const key = wk.toISOString().slice(0, 10);
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }
  const thisWeekKey = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().slice(0, 10);

  return (
    <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto animate-fadeIn">
      <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-t1 mb-4">Histórico</h1>

      <div className="flex gap-3 mb-6">
        <StatPill icon={<Dumbbell size={18} />} value={summary?.totalWorkouts ?? logs.length} label="Treinos" />
        <StatPill icon={<Layers size={18} />} value={summary?.totalSets ?? 0} label="Séries" />
        <StatPill icon={<Flame size={18} />} value={summary?.streak ?? 0} label="Streak" />
      </div>

      {logs.length === 0 ? (
        <Empty icon={<Dumbbell size={28} className="text-brand" />} title="Sem treinos ainda" subtitle="Os treinos que concluíres aparecem aqui." />
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([key, items]) => (
            <div key={key}>
              <h2 className="text-sm font-bold text-t2 mb-2">
                {key === thisWeekKey ? "Esta Semana" : `Semana de ${format(new Date(key), "d 'de' MMM", { locale: pt })}`}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((l) => (
                  <Card key={l.logId} className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-lt flex items-center justify-center shrink-0">
                      <Dumbbell size={18} className="text-brand-dk" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-t1 truncate">{l.workoutName}</p>
                      <p className="text-xs text-t3">{relativeDays(l.date)} · {l.durationMin} min · {l.totalSets} séries</p>
                    </div>
                    {l.workoutId && (
                      <button onClick={() => navigate(`/treino/${l.workoutId}`)} className="flex items-center gap-1 text-xs font-semibold text-brand px-2.5 py-1.5 rounded-lg bg-brand-lt">
                        <Repeat size={13} /> Repetir
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

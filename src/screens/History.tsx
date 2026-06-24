import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Repeat, Flame, Layers, ChevronRight } from "lucide-react";
import { useLogs, useSummary, useLogDetail } from "../api";
import type { GymLog } from "../api";
import { Card, Spinner, Empty, Modal } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { useCms } from "../context/CmsContext";
import { relativeDays } from "../lib/format";
import { groupColor } from "../lib/exercises";
import { startOfWeek, format } from "date-fns";
import { pt } from "date-fns/locale";

/** Modal de detalhe de uma sessão: exercícios + séries feitas (peso · reps). */
function SessionDetailModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const { t } = useCms();
  const { data, isLoading } = useLogDetail(logId);
  const log = data as { workoutName?: string; durationMin?: number; date?: string; entries?: { exerciseName: string; group?: string | null; sets: { weight?: number; reps?: number; done?: boolean }[] }[] } | undefined;
  const entries = log?.entries ?? [];
  return (
    <Modal open onClose={onClose} title={log?.workoutName ?? t("gym.app.nav.history")}>
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner className="h-7 w-7" /></div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-t3 text-center py-8">{t("gym.app.history.no_detail")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {log?.date && <p className="text-[12px] text-t3 -mt-1">{relativeDays(log.date)} · {log.durationMin} {t("gym.app.common.min")}</p>}
          {entries.map((e, i) => (
            <div key={i} className="rounded-xl bg-bg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: groupColor(e.group) }} />
                <span className="font-semibold text-sm text-t1 truncate">{e.exerciseName}</span>
              </div>
              <div className="flex flex-col gap-1">
                {e.sets.map((s, si) => (
                  <div key={si} className="flex items-center justify-between text-[13px]">
                    <span className="text-t3">{t("gym.app.exec.series_label")} {si + 1}</span>
                    <span className="font-semibold text-t1 tnum">{s.weight ?? 0}kg · {s.reps ?? 0} {t("gym.app.common.reps")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

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
  const { t } = useCms();
  const { data, isLoading } = useLogs({});
  const { data: summary } = useSummary();
  const logs = (data ?? []) as GymLog[];
  const [detailId, setDetailId] = useState<string | null>(null);

  useScreenHeader({ title: t("gym.app.nav.history") });

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
    <div className="animate-fadeIn">
      <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto">
      <div className="flex gap-3 mb-6">
        <StatPill icon={<Dumbbell size={18} />} value={summary?.totalWorkouts ?? logs.length} label={t("gym.app.history.stat_workouts")} />
        <StatPill icon={<Layers size={18} />} value={summary?.totalSets ?? 0} label={t("gym.app.history.stat_sets")} />
        <StatPill icon={<Flame size={18} />} value={summary?.streak ?? 0} label={t("gym.app.history.stat_streak")} />
      </div>

      {logs.length === 0 ? (
        <Empty icon={<Dumbbell size={28} className="text-brand" />} title={t("gym.app.history.empty_title")} subtitle={t("gym.app.history.empty_sub")} />
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([key, items]) => (
            <div key={key}>
              <h2 className="text-sm font-bold text-t2 mb-2">
                {key === thisWeekKey ? t("gym.app.history.this_week") : `${t("gym.app.history.week_of")} ${format(new Date(key), "d 'de' MMM", { locale: pt })}`}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((l) => (
                  <Card key={l.logId} onClick={() => setDetailId(l.logId)} className="p-3.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-brand-lt flex items-center justify-center shrink-0">
                      <Dumbbell size={18} className="text-brand-dk" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-t1 truncate">{l.workoutName}</p>
                      <p className="text-xs text-t3">{relativeDays(l.date)} · {l.durationMin} {t("gym.app.common.min")} · {l.totalSets} {t("gym.app.common.sets")}</p>
                    </div>
                    {l.workoutId && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/treino/${l.workoutId}`); }} className="flex items-center gap-1 text-xs font-semibold text-brand px-2.5 py-1.5 rounded-lg bg-brand-lt">
                        <Repeat size={13} /> {t("gym.app.history.repeat")}
                      </button>
                    )}
                    <ChevronRight size={16} className="text-t3 shrink-0" />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      {detailId && <SessionDetailModal logId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Dumbbell, Repeat, Flame, Layers, ChevronRight, Trash2 } from "lucide-react";
import { useLogs, useSummary, useLogDetail, deleteLog } from "../api";
import type { GymLog } from "../api";
import { useInvalidateGym } from "../hooks/useGym";
import { Card, Spinner, Empty, Modal, Button } from "../components/ui";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";
import { useScreenHeader } from "../store/useHeader";
import { useCms } from "../context/CmsContext";
import { relativeDays, localDateISO } from "../lib/format";
import { groupColor } from "../lib/exercises";
import { startOfWeek, format } from "date-fns";
import { pt } from "date-fns/locale";

/** Modal de detalhe de uma sessão: exercícios + séries feitas (peso · reps). */
function SessionDetailModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const { t } = useCms();
  const { data, isLoading } = useLogDetail(logId);
  const invalidate = useInvalidateGym();
  const [confirming, setConfirming] = useState(false);
  const log = data as { workoutName?: string; durationMin?: number; date?: string; createdAt?: string | null; entries?: { exerciseName: string; group?: string | null; sets: { weight?: number; reps?: number; done?: boolean }[] }[] } | undefined;
  const entries = log?.entries ?? [];

  const del = useMutation({
    mutationFn: () => deleteLog(logId),
    onSuccess: () => {
      invalidate();
      toast.success(t("gym.app.history.deleted"));
      onClose();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  // Dia + hora do treino (da data de registo; fallback para a data do treino).
  const when = log?.createdAt ?? (log?.date ? `${log.date}T00:00:00` : null);
  const parts: string[] = [];
  if (when) parts.push(format(new Date(when), "EEE, d 'de' MMM", { locale: pt }));
  if (log?.createdAt) parts.push(format(new Date(log.createdAt), "HH:mm"));
  if (log?.durationMin) parts.push(`${log.durationMin} ${t("gym.app.common.min")}`);
  const subtitle = parts.length ? parts.join(" · ") : undefined;

  return (
    <Modal open onClose={onClose} title={log?.workoutName ?? t("gym.app.nav.history")} subtitle={subtitle}
      headerAction={
        <button onClick={() => setConfirming(true)} title={t("gym.app.history.delete")} className="w-8 h-8 rounded-[10px] bg-bg flex items-center justify-center text-red active:scale-95 transition">
          <Trash2 size={15} />
        </button>
      }>
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner className="h-7 w-7" /></div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-t3 text-center py-8">{t("gym.app.history.no_detail")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e, i) => (
            <div key={i} className="rounded-xl bg-bg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: groupColor(e.group) }} />
                <span className="font-semibold text-sm text-t1 truncate">{e.exerciseName}</span>
              </div>
              <div className="flex flex-col gap-1">
                {e.sets.map((s, si) => (
                  <div key={si} className={`flex items-center justify-between text-[13px] ${s.done === false ? "opacity-50" : ""}`}>
                    <span className="text-t3">{t("gym.app.exec.series_label")} {si + 1} {s.done === false && `(${t("gym.app.history.not_done") || "não feita"})`}</span>
                    <span className="font-semibold text-t1 tnum">{(s as any).duration ? `${(s as any).duration}s` : `${s.weight ?? 0}kg · ${s.reps ?? 0} ${t("gym.app.common.reps")}`}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pop-up temático de confirmação */}
      {confirming && (
        <Modal open onClose={() => setConfirming(false)} title={t("gym.app.history.delete_title")}>
          <div className="pt-1">
            <p className="text-[14px] text-t2 mb-5">{t("gym.app.history.delete_confirm")}</p>
            <div className="flex flex-col gap-2.5">
              <Button fullWidth size="lg" variant="danger" disabled={del.isPending} onClick={() => del.mutate()}>{del.isPending ? t("gym.app.common.saving") : t("gym.app.history.delete")}</Button>
              <Button fullWidth variant="ghost" onClick={() => setConfirming(false)}>{t("gym.app.common.cancel")}</Button>
            </div>
          </div>
        </Modal>
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
    const key = localDateISO(wk);
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }
  const thisWeekKey = localDateISO(startOfWeek(new Date(), { weekStartsOn: 1 }));

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

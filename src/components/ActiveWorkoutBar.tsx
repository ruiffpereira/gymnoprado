import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { formatClock } from "../lib/format";
import { useCms } from "../context/CmsContext";

/**
 * Barra flutuante do treino minimizado. Aparece em toda a app (dentro do
 * Layout) quando há um treino ativo; tocar volta ao ecrã de execução.
 * O ecrã de execução é full-screen (fora do Layout), por isso a barra nunca
 * se sobrepõe a ele.
 */
export function ActiveWorkoutBar() {
  const navigate = useNavigate();
  const { t } = useCms();
  const workoutId = useActiveWorkout((s) => s.workoutId);
  const name = useActiveWorkout((s) => s.name);
  const startedAt = useActiveWorkout((s) => s.startedAt);
  const done = useActiveWorkout((s) => s.doneSets());
  const total = useActiveWorkout((s) => s.totalSets());

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!workoutId) return null;
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <button
      onClick={() => navigate(`/treino/${workoutId}/executar`)}
      className="fixed z-50 left-3 right-3 lg:left-[264px] lg:right-6 bottom-[calc(env(safe-area-inset-bottom,0px)+70px)] lg:bottom-5 bg-ink text-white rounded-[16px] shadow-lg overflow-hidden flex items-center gap-3 pl-4 pr-3 py-2.5 animate-slideUp"
      title={t("gym.app.exec.resume_hint")}
    >
      <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-white/55">{t("gym.app.exec.in_training")}</span>
          <span className="text-[11px] text-white/45 tnum">{done}/{total} {t("gym.app.exec.sets_done")}</span>
        </div>
        <div className="text-[14px] font-bold truncate">{name}</div>
      </div>
      <span className="text-[18px] font-black tnum tracking-[-0.02em] shrink-0">{formatClock(elapsed)}</span>
      <span className="w-9 h-9 rounded-full bg-brand flex items-center justify-center shrink-0">
        <ChevronUp size={18} className="text-white" />
      </span>
      <div className="absolute left-0 bottom-0 h-[3px] bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </button>
  );
}

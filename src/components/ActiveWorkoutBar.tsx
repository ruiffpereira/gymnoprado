import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, Play, X } from "lucide-react";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { formatClock } from "../lib/format";
import { useCms } from "../context/CmsContext";

/**
 * Um treino reidratado com mais de 6h não é "EM TREINO" — é quase de certeza
 * uma sessão esquecida (app fechada a meio). Em vez de um cronómetro eterno,
 * a barra passa a perguntar: Retomar (mantém tudo) ou Descartar (limpa).
 */
const ACTIVE_WORKOUT_TTL_MS = 6 * 60 * 60 * 1000;
const DISCARD_CONFIRM_WINDOW_MS = 4000;

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
  const clear = useActiveWorkout((s) => s.clear);

  const [now, setNow] = useState(Date.now());
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const confirmDiscardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Limpa o timer ao desmontar.
  useEffect(() => () => {
    if (confirmDiscardTimer.current) clearTimeout(confirmDiscardTimer.current);
  }, []);

  if (!workoutId) return null;
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const pct = total ? (done / total) * 100 : 0;
  const stale = startedAt != null && now - startedAt > ACTIVE_WORKOUT_TTL_MS;

  const discardStale = () => {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      if (confirmDiscardTimer.current) clearTimeout(confirmDiscardTimer.current);
      confirmDiscardTimer.current = setTimeout(() => setConfirmDiscard(false), DISCARD_CONFIRM_WINDOW_MS);
      return;
    }
    if (confirmDiscardTimer.current) clearTimeout(confirmDiscardTimer.current);
    clear();
  };

  // Treino esquecido (>6h): escolha explícita em vez de "EM TREINO" eterno.
  if (stale) {
    return (
      <div className="fixed z-50 left-3 right-3 lg:left-[264px] lg:right-6 bottom-[calc(env(safe-area-inset-bottom,0px)+70px)] lg:bottom-5 bg-ink text-white rounded-[16px] shadow-lg overflow-hidden flex items-center gap-3 pl-4 pr-3 py-2.5 animate-slideUp">
        <span className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55">
            {t("gym.app.bar.stale_hint") || "Treino aberto há mais de 6 horas"}
          </div>
          <div className="text-[14px] font-bold truncate">{name}</div>
        </div>
        <button
          onClick={() => navigate(`/treino/${workoutId}/executar`)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[11px] bg-brand text-white text-[12.5px] font-extrabold active:scale-95 transition"
        >
          <Play size={14} fill="currentColor" /> {t("gym.app.bar.resume") || "Retomar"}
        </button>
        <button
          onClick={discardStale}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[11px] bg-white/10 text-white/85 text-[12.5px] font-extrabold active:scale-95 transition"
        >
          <X size={14} /> {confirmDiscard ? (t("gym.app.bar.discard_confirm") || "Tem a certeza?") : (t("gym.app.bar.discard") || "Descartar")}
        </button>
      </div>
    );
  }

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

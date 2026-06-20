import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, ChevronLeft, ChevronRight, Trophy, Pause, Play, Dumbbell } from "lucide-react";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { useCreateLog } from "../hooks/useGym";
import { Button, Stepper, ProgressRing } from "../components/ui";
import { formatClock } from "../lib/format";
import { groupColor } from "../lib/exercises";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return startedAt ? Math.floor((now - startedAt) / 1000) : 0;
}

function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) { onClose(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur flex flex-col items-center justify-center gap-8 animate-fadeIn">
      <p className="text-white/60 font-semibold tracking-widest text-sm">DESCANSO</p>
      <ProgressRing value={remaining} max={seconds} size={220} stroke={10} label={formatClock(remaining)} color="var(--green)" />
      <div className="flex items-center gap-3">
        <button onClick={() => setRemaining((r) => r + 15)} className="px-4 py-2.5 rounded-btn bg-white/10 text-white font-semibold">+15s</button>
        <button onClick={() => setPaused((p) => !p)} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
          {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} />}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-btn bg-brand text-white font-semibold">Saltar</button>
      </div>
    </div>
  );
}

export function WorkoutExec() {
  const navigate = useNavigate();
  const wk = useActiveWorkout();
  const elapsed = useElapsed(wk.startedAt);
  const [rest, setRest] = useState<number | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const createLog = useCreateLog();

  useEffect(() => {
    if (!wk.workoutId) navigate("/treinos", { replace: true });
  }, [wk.workoutId, navigate]);

  if (!wk.workoutId || wk.exercises.length === 0) return null;

  const idx = wk.currentIndex;
  const ex = wk.exercises[idx];
  const total = wk.totalSets();
  const done = wk.doneSets();
  const isLast = idx === wk.exercises.length - 1;

  const toggleSet = (setIdx: number) => {
    const wasDone = ex.sets[setIdx].done;
    wk.toggleDone(idx, setIdx);
    if (!wasDone) setRest(ex.rest);
  };

  const finish = () => {
    createLog.mutate(wk.buildLog(), {
      onSuccess: () => {
        toast.success("Treino guardado! 💪");
        wk.clear();
        navigate("/", { replace: true });
      },
      onError: (e) => toast.error(apiErrorMessage(e, "Não foi possível guardar.")),
    });
  };

  const quit = () => {
    if (confirm("Sair sem guardar o treino?")) {
      wk.clear();
      navigate(-1);
    }
  };

  const color = groupColor(ex.group);

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-4 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={quit} className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center"><X size={18} className="text-t2" /></button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-t1 truncate">{wk.name}</p>
            <p className="text-xs text-t3 tnum">{formatClock(elapsed)} · {done}/{total} séries</p>
          </div>
          <button onClick={() => setFinishOpen(true)} className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold">Terminar</button>
        </div>
        <div className="h-1.5 rounded-full bg-surface overflow-hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pb-4">
        <div className="bg-surface rounded-card shadow-card overflow-hidden">
          {/* Media banner */}
          <div className="relative h-44 flex items-center justify-center" style={{ background: `${color}1A` }}>
            {ex.mediaUrl ? (
              <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover" />
            ) : (
              <Dumbbell size={48} style={{ color }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white/70 text-xs font-semibold">Exercício {idx + 1}/{wk.exercises.length}</p>
              <p className="text-white font-black text-xl">{ex.name}</p>
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-line text-center">
            <div><p className="text-lg font-black text-t1 tnum">{ex.sets.length}</p><p className="text-[11px] text-t3">Séries</p></div>
            <div><p className="text-lg font-black text-t1 tnum">{ex.targetReps}</p><p className="text-[11px] text-t3">Reps alvo</p></div>
            <div><p className="text-lg font-black text-t1 tnum">{ex.rest}s</p><p className="text-[11px] text-t3">Descanso</p></div>
          </div>

          {/* Sets */}
          <div className="p-4 flex flex-col gap-2.5">
            {ex.sets.map((s, si) => (
              <div key={si} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${s.done ? "bg-brand-lt" : "bg-bg"}`}>
                <span className="w-6 text-center font-bold text-t2 text-sm">{si + 1}</span>
                <div className="flex-1 flex items-center justify-around gap-2">
                  <div className="text-center">
                    <Stepper value={s.weight} step={2.5} onChange={(v) => wk.updateSet(idx, si, { weight: v })} suffix="kg" />
                  </div>
                  <div className="text-center">
                    <Stepper value={s.reps} step={1} onChange={(v) => wk.updateSet(idx, si, { reps: v })} />
                  </div>
                </div>
                <button onClick={() => toggleSet(si)} className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-brand text-white" : "bg-surface border border-line text-t3"}`}>
                  <Check size={18} />
                </button>
              </div>
            ))}
            <Button variant="greenLight" onClick={() => setRest(ex.rest)}>Iniciar descanso ({ex.rest}s)</Button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="px-5 pb-6 flex items-center gap-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <Button variant="surface" icon={<ChevronLeft size={18} />} disabled={idx === 0} onClick={() => wk.setIndex(idx - 1)}>Anterior</Button>
        {isLast ? (
          <Button fullWidth onClick={() => setFinishOpen(true)}>Terminar Treino</Button>
        ) : (
          <Button fullWidth onClick={() => wk.setIndex(idx + 1)}>Próximo Exercício <ChevronRight size={18} /></Button>
        )}
      </div>

      {rest !== null && <RestTimer seconds={rest} onClose={() => setRest(null)} />}

      {finishOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setFinishOpen(false)}>
          <div className="bg-surface w-full sm:max-w-sm rounded-t-[24px] sm:rounded-card p-6 text-center animate-slideUp">
            <div className="w-16 h-16 rounded-full bg-brand-lt mx-auto flex items-center justify-center mb-4">
              <Trophy size={28} className="text-brand-dk" />
            </div>
            <h3 className="text-xl font-black text-t1 mb-1">Bom trabalho!</h3>
            <p className="text-t2 text-sm mb-5">{formatClock(elapsed)} · {done} séries concluídas</p>
            <div className="flex flex-col gap-2">
              <Button fullWidth disabled={createLog.isPending} onClick={finish}>{createLog.isPending ? "A guardar…" : "Guardar Treino"}</Button>
              <Button fullWidth variant="ghost" onClick={() => setFinishOpen(false)}>Continuar a treinar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

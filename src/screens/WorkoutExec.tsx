import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronDown, Trophy, Pause, Play, Timer, List, Minus, Plus, Dumbbell, ArrowDown } from "lucide-react";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { useCreateLog } from "../hooks/useGym";
import { Button, Modal, Badge } from "../components/ui";
import { formatClock } from "../lib/format";
import { groupColor } from "../lib/exercises";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";
import { useCms } from "../context/CmsContext";

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return startedAt ? Math.floor((now - startedAt) / 1000) : 0;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function WorkoutExec() {
  const navigate = useNavigate();
  const { t } = useCms();
  const wk = useActiveWorkout();
  const elapsed = useElapsed(wk.startedAt);

  // Descanso/pausa: vive no store persistido (sobrevive a fechar/reabrir a app).
  const rest = wk.rest;
  const resting = !!rest;
  const restLeft = rest?.remaining ?? 0;
  const restTotal = rest?.total ?? 60;
  const restKind = rest?.kind ?? "normal";
  const restMsg = rest?.msg ?? "";

  const [showFinish, setShowFinish] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickSel, setPickSel] = useState(0);
  const createLog = useCreateLog();

  // Fim do descanso → conclui a série guardada e avança (no store).
  const resolveRest = () => wk.finishRest();

  useEffect(() => {
    if (!wk.workoutId) navigate("/treinos", { replace: true });
  }, [wk.workoutId, navigate]);

  // Contagem decrescente do descanso → ao chegar a 0, resolve (avança).
  useEffect(() => {
    if (!resting) return;
    if (restLeft <= 0) { resolveRest(); return; }
    const id = setTimeout(() => wk.tickRest(), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting, restLeft]);

  if (!wk.workoutId || wk.exercises.length === 0) return null;

  const current = wk.currentIndex;
  const totalEx = wk.exercises.length;
  const ex = wk.exercises[current];
  const aSet = wk.activeSet[current] ?? 0;
  const sets = ex.sets;
  const cur = sets[aSet];
  const completedSets = wk.doneSets();
  const totalSets = wk.totalSets();
  const exDone = sets.every((s) => s.done);
  const isLastEx = current === totalEx - 1;
  const isTime = ex.type === "time";

  const color = groupColor(ex.group);

  // doneAfter = quantas séries ficam feitas ao concluir a série atual
  const doneAfter = sets.filter((s) => s.done).length + (cur.done ? 0 : 1);
  const willFinishEx = doneAfter >= sets.length;

  // ── Drop set (modelo achatado): a série atual é um "passo" de um dropset. ──
  // Agrupamos os passos consecutivos (dropStep 1..dropTotal) para mostrar a
  // cascata de drops, sem mudar o modelo de dados (apenas visual).
  const isDropStep = cur.dropStep != null;
  const dropTotal = cur.dropTotal ?? 0;
  const isLastDropStep = !isDropStep || (cur.dropStep ?? 1) >= dropTotal;

  const updateField = (field: "weight" | "reps" | "duration", delta: number) => {
    wk.updateSet(current, aSet, { [field]: Math.max(0, round2(cur[field] + delta)) });
  };

  // Conclui o passo atual e arranca o descanso. O avanço para a próxima
  // série/passo só acontece quando o descanso termina (resolveRest).
  const completeAndRest = () => {
    const exIdx = current, sIdx = aSet;

    // Último passo do treino → conclui já, sem descanso.
    if (willFinishEx && isLastEx) {
      wk.setDone(exIdx, sIdx, true);
      setShowFinish(true);
      return;
    }

    // Texto "A seguir: …" e tipo de descanso (drop = mini-descanso).
    let kind: "normal" | "drop" = "normal";
    let msg: string;
    if (isDropStep && !isLastDropStep) {
      kind = "drop";
      msg = `${t("gym.app.exec.dropset_label") || "Dropset"} ${(cur.dropStep ?? 1) + 1}/${dropTotal}`;
    } else if (willFinishEx) {
      msg = `${t("gym.app.exec.next_up") || "A seguir"}: ${t("gym.app.exec.next_up_exercise") || "próximo exercício"}`;
    } else {
      const np = sets.findIndex((s, i) => i !== sIdx && !s.done);
      const n = (np !== -1 ? np : sIdx + 1) + 1;
      msg = `${t("gym.app.exec.next_up") || "A seguir"}: ${n}ª ${t("gym.app.exec.series_label") || "Série"}`;
    }

    const restDur = cur.rest ?? ex.rest;
    if (restDur > 0) {
      // Guarda o descanso no store (a série a concluir/avançar fica em exIdx/setIdx);
      // o avanço acontece quando o descanso termina (finishRest).
      wk.startRest({ remaining: restDur, total: restDur, kind, msg, exIdx, setIdx: sIdx });
    } else {
      wk.advanceAfterSet(exIdx, sIdx); // sem descanso → avança já
    }
  };

  // Marca todas as séries do exercício como concluídas (salta as restantes).
  const completeExercise = () => {
    wk.cancelRest();
    sets.forEach((_, si) => wk.setDone(current, si, true));
  };

  // Reabrir uma série (mesmo já concluída) para a editar durante o treino.
  const reopenSet = (si: number) => {
    wk.cancelRest();
    if (sets[si].done) wk.setDone(current, si, false);
    wk.setActiveSet(current, si);
  };

  const goNext = () => {
    if (current < totalEx - 1) wk.setIndex(current + 1);
    else setShowFinish(true);
  };

  const jumpTo = (i: number) => {
    wk.cancelRest();
    wk.setIndex(i);
    const fp = wk.exercises[i].sets.findIndex((s) => !s.done);
    wk.setActiveSet(i, fp === -1 ? 0 : fp);
    setShowPicker(false);
  };

  const finishWorkout = () => {
    createLog.mutate(wk.buildLog(), {
      onSuccess: () => {
        toast.success(t("gym.app.exec.saved"));
        wk.clear();
        navigate("/", { replace: true });
      },
      onError: (e) => toast.error(apiErrorMessage(e, t("gym.app.exec.save_error"))),
    });
  };

  // Minimizar: sai do ecrã mas mantém o treino ativo (a barra flutuante volta cá).
  const minimize = () => {
    navigate("/");
  };

  // Descartar: termina o treino sem guardar.
  const discard = () => {
    wk.clear();
    navigate("/", { replace: true });
  };

  // Subtítulo do CTA "FAZER AGORA" (orientado à ação, como no protótipo).
  const ctaSub = isDropStep && !isLastDropStep
    ? (t("gym.app.exec.cta_sub_drop") || "Terminei o drop · baixar peso")
    : willFinishEx && isLastEx
      ? (t("gym.app.exec.cta_sub_finish") || "Terminei · concluir treino")
      : (t("gym.app.exec.cta_sub_rest") || "Terminei a série · descansar");

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* ── Header escuro com cronómetro grande ── */}
      <div className="bg-ink px-[18px] pb-[18px] sticky top-0 z-50" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <button onClick={minimize} title={t("gym.app.exec.minimize")} className="w-[38px] h-[38px] rounded-[11px] bg-white/10 flex items-center justify-center"><ChevronDown size={20} className="text-white" /></button>
          <div className="text-[13px] font-bold text-white/85 truncate max-w-[55%]">{wk.name}</div>
          <button onClick={() => setShowFinish(true)} className="px-[15px] py-[9px] rounded-[11px] bg-brand text-white text-[13px] font-extrabold">{t("gym.app.exec.finish")}</button>
        </div>
        {/* Tempo a correr */}
        <div className="flex flex-col items-center gap-0.5 pt-2 pb-1">
          <div className="flex items-center gap-[7px]">
            <span className="w-[9px] h-[9px] rounded-full animate-pulse" style={{ background: resting ? "#F97316" : "var(--green)" }} />
            <span className="text-[11px] font-extrabold tracking-[0.14em]" style={{ color: resting ? "#FBBF77" : "rgba(255,255,255,0.55)" }}>{resting ? t("gym.app.exec.state_resting") : t("gym.app.exec.state_training")}</span>
          </div>
          <div className="text-[52px] font-black text-white leading-none tnum tracking-[-0.02em]">{formatClock(elapsed)}</div>
          <div className="text-[12.5px] text-white/50 font-medium">{completedSets}/{totalSets} {t("gym.app.exec.sets_done")}</div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-1 bg-line">
        <div className="h-full bg-gradient-to-r from-brand to-brand-dk transition-[width] duration-500" style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} />
      </div>

      {/* Main (paddingBottom dá espaço à barra fixa do CTA) */}
      <div className="flex-1 flex flex-col items-center px-4 py-[18px] lg:px-6 lg:py-6 w-full max-w-[520px] mx-auto" style={{ paddingBottom: 150 }}>
        {/* Posição do exercício */}
        <div className="flex items-center justify-between w-full mb-3">
          <span className="text-[13px] font-bold text-t2">{t("gym.app.exec.exercise_label")} {current + 1} {t("gym.app.common.of")} {totalEx}</span>
          <div className="flex gap-[5px]">
            {wk.exercises.map((e, i) => {
              const eDone = e.sets.every((s) => s.done);
              return <span key={i} className="h-2 rounded-full transition-all duration-200" style={{ width: i === current ? 22 : 8, background: i === current ? "var(--green)" : eDone ? "var(--green-dk)" : "var(--border)" }} />;
            })}
          </div>
        </div>

        <div key={current} className={`w-full animate-fadeIn rounded-card ${!exDone && !resting ? "go-border" : ""}${!exDone && resting ? "rest-border" : ""}`}>
          <div className="bg-surface rounded-card shadow-card overflow-hidden">
            <div className="p-5 lg:p-6">
              {/* Grupo + nome */}
              <div className="flex items-center gap-[7px] mb-[7px]">
                <span className="w-[9px] h-[9px] rounded-full" style={{ background: color }} />
                <span className="text-[12px] font-extrabold uppercase tracking-[0.06em]" style={{ color }}>{ex.group}</span>
              </div>
              <div className="text-[26px] font-black text-t1 leading-[1.05] tracking-[-0.03em] mb-[18px]">{ex.name}</div>

              {/* ── Pontos de série (tocar reabre p/ editar) ── */}
              {!exDone && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12.5px] font-bold text-t3">{t("gym.app.exec.target_sets")}</span>
                  <div className="flex gap-1.5">
                    {sets.map((s, si) => (
                      <button key={si} onClick={() => reopenSet(si)} title={s.dropStep ? `${t("gym.app.exec.dropset_label") || "Dropset"} · ${t("gym.app.exec.step_label") || "passo"} ${s.dropStep}/${s.dropTotal}` : `${t("gym.app.exec.series_label")} ${si + 1}`}
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-all relative"
                        style={{ background: s.done ? "var(--green)" : si === aSet ? "var(--surface)" : "var(--bg)", boxShadow: si === aSet && !s.done ? "inset 0 0 0 2px var(--green)" : s.dropStep ? "inset 0 0 0 1.5px #F9731788" : "none" }}>
                        {s.done ? <Check size={15} className="text-white" /> : <span className="text-[13.5px] font-extrabold" style={{ color: si === aSet ? "var(--green-dk)" : s.dropStep ? "#C2742B" : "var(--t3)" }}>{si + 1}</span>}
                        {s.dropStep != null && !s.done && <span className="absolute -top-1 -right-1 text-[9px] font-black" style={{ color: "#F97316" }}>↓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Steppers (visíveis também durante o descanso) ── */}
              {!exDone && (
                <>
                  <div className="flex items-stretch bg-bg rounded-[18px] overflow-hidden mb-3">
                    {(isTime
                      ? [{ label: t("gym.app.exec.duration_label") || "Duração (s)", field: "duration" as const, step: 5, val: cur.duration }]
                      : [
                          { label: t("gym.app.exec.weight_label"), field: "weight" as const, step: 2.5, val: cur.weight },
                          { label: t("gym.app.exec.reps_label"), field: "reps" as const, step: 1, val: cur.reps },
                        ]
                    ).map((f, fi) => (
                      <div key={f.field} className="flex-1 flex">
                        {fi === 1 && <div className="w-px bg-line my-3.5" />}
                        <div className="flex-1 flex flex-col items-center gap-[11px] pt-4 pb-[18px] px-1.5">
                          <span className="text-[11px] font-extrabold text-t3 tracking-[0.07em]">{f.label}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateField(f.field, -f.step)} className="w-[34px] h-[34px] rounded-full bg-surface shadow-card flex items-center justify-center active:scale-95 transition"><Minus size={15} className="text-t2" /></button>
                            <span className="text-[32px] font-black text-t1 min-w-[50px] text-center tnum tracking-[-0.02em]">{f.val}</span>
                            <button onClick={() => updateField(f.field, f.step)} className="w-[34px] h-[34px] rounded-full bg-brand flex items-center justify-center active:scale-95 transition"><Plus size={15} className="text-white" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Referência: valor do último treino para esta série */}
                  {(isTime ? cur.lastDuration != null : cur.lastWeight != null) && (
                    <div className="text-center text-[12px] text-t3 font-medium mb-1 -mt-1">
                      {t("gym.app.exec.last_label")}: {isTime ? `${cur.lastDuration}s` : `${cur.lastWeight}kg · ${cur.lastReps} ${t("gym.app.common.reps")}`}
                    </div>
                  )}

                  {/* Dar exercício como concluído (salta séries restantes) */}
                  {!resting && sets.length > 1 && (
                    <button onClick={completeExercise} className="flex items-center justify-center gap-1.5 w-full mt-2.5 py-2.5 rounded-xl text-t2 text-[13px] font-semibold active:bg-bg transition-colors">
                      <Check size={15} className="text-t3" /> {t("gym.app.exec.mark_exercise_done")}
                    </button>
                  )}
                </>
              )}

              {exDone && (
                <div className="text-center py-1">
                  <div className="w-[60px] h-[60px] rounded-full bg-brand-xlt flex items-center justify-center mx-auto mt-1 mb-3.5">
                    <Check size={28} className="text-brand" />
                  </div>
                  <div className="text-[16px] font-extrabold text-t1 mb-1">{t("gym.app.exec.exercise_done")}</div>
                  <div className="text-[14px] text-t2">{t("gym.app.exec.ex_done_prefix")} {sets.length} {t("gym.app.exec.ex_done_suffix")}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acesso secundário: saltar para outro exercício */}
        <div className="mt-3.5 w-full">
          <Button variant="ghost" fullWidth onClick={() => { setPickSel(current); setShowPicker(true); }} icon={<List size={17} className="text-t2" />}>{t("gym.app.exec.choose_other")}</Button>
        </div>
      </div>

      {/* ──── BARRA FIXA AO FUNDO — CTA grande, sempre no mesmo lugar ──── */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-surface/95 backdrop-blur-xl border-t border-line" style={{ padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-[520px] mx-auto w-full">
          {/* Próximo / Terminar (exercício concluído) */}
          {exDone && (
            <Button fullWidth size="lg" onClick={goNext} className="!h-[96px] !rounded-[20px] text-[17px]"
              icon={isLastEx ? <Trophy size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}>
              {isLastEx ? t("gym.app.exec.finish_workout") : t("gym.app.exec.next_exercise")}
            </Button>
          )}

          {/* FAZER AGORA (verde, toca para concluir + descansar) */}
          {!exDone && !resting && (
            <button onClick={completeAndRest} className="w-full h-[96px] box-border text-left border-none cursor-pointer relative rounded-[20px] px-[18px] overflow-hidden"
              style={{ background: "linear-gradient(135deg, var(--green) 0%, var(--green-dk) 100%)", boxShadow: "0 6px 20px rgba(141,198,63,0.32)", animation: "goGlow 1.8s ease-in-out infinite, goPop 0.35s ease" }}>
              <span className="absolute rounded-full pointer-events-none" style={{ top: "50%", left: 38, width: 54, height: 54, marginTop: -27, marginLeft: -27, border: "2px solid rgba(255,255,255,0.45)", animation: "goRing 1.8s ease-out infinite" }} />
              <span className="absolute rounded-full pointer-events-none" style={{ top: "50%", left: 38, width: 54, height: 54, marginTop: -27, marginLeft: -27, border: "2px solid rgba(255,255,255,0.35)", animation: "goRing 1.8s ease-out infinite 0.9s" }} />
              <div className="relative h-full flex items-center gap-3.5">
                <div className="w-[58px] h-[58px] rounded-[17px] shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div style={{ animation: "liftBob 1s ease-in-out infinite" }}><Dumbbell size={30} className="text-white" /></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[23px] font-black text-white leading-none tracking-[-0.02em]" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>{t("gym.app.exec.go_now")}</div>
                  <div className="text-[13.5px] font-bold text-white/90 mt-[5px] truncate">{ctaSub}</div>
                </div>
                {isDropStep
                  ? <div className="shrink-0 text-white text-[10px] font-black tracking-[0.05em] px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.22)" }}>{t("gym.app.exec.drop_short") || "DROP"} {cur.dropStep}/{dropTotal}</div>
                  : <ChevronRight size={22} className="text-white" />}
              </div>
            </button>
          )}

          {/* DESCANSO (laranja, toca para saltar) */}
          {!exDone && resting && (
            <button onClick={resolveRest} title={t("gym.app.exec.rest_skip_hint")} className="w-full h-[96px] box-border border-none cursor-pointer rounded-[20px] px-[18px] relative overflow-hidden animate-fadeIn"
              style={{ background: "#FFF7ED", boxShadow: "inset 0 0 0 1.5px #F9731833" }}>
              <div className="relative h-full flex items-center gap-3.5">
                <div className="w-[58px] h-[58px] rounded-[17px] shrink-0 flex items-center justify-center" style={{ background: "#F97316", animation: "breathe 1.6s ease-in-out infinite" }}>
                  {restKind === "drop" ? <ArrowDown size={28} className="text-white" /> : <Timer size={28} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[12px] font-extrabold tracking-[0.1em]" style={{ color: "#F97316" }}>{restKind === "drop" ? (t("gym.app.exec.rest_drop_label") || "BAIXA O PESO") : t("gym.app.exec.rest_label")}</div>
                  <div className="text-[13px] font-bold mt-[3px] truncate" style={{ color: "#C2742B" }}>{restMsg || t("gym.app.exec.rest_label")} · {t("gym.app.exec.rest_skip_hint")}</div>
                </div>
                <span className="text-[40px] font-black leading-none tnum tracking-[-0.02em] shrink-0" style={{ color: "#B45309" }}>{restLeft >= 60 ? formatClock(restLeft) : restLeft}</span>
              </div>
              <div className="absolute left-0 right-0 bottom-0 h-1.5" style={{ background: "#FCE3C8" }}>
                <div className="h-full transition-[width] duration-1000 ease-linear" style={{ width: `${restTotal ? (restLeft / restTotal) * 100 : 0}%`, background: "#F97316" }} />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Picker de exercício — dois passos */}
      <Modal open={showPicker} onClose={() => setShowPicker(false)} title={t("gym.app.exec.picker_title")}>
        <div className="flex flex-col gap-2">
          {wk.exercises.map((e, i) => {
            const done = e.sets.filter((s) => s.done).length;
            const all = e.sets.length;
            const isCur = i === current;
            const isSel = i === pickSel;
            const finished = done === all;
            const paused = done > 0 && !finished && !isCur;
            const c = groupColor(e.group);
            return (
              <button key={i} onClick={() => setPickSel(i)}
                className="flex items-center gap-3 p-3 rounded-[14px] text-left transition-all"
                style={{ border: `2px solid ${isSel ? "var(--green)" : "var(--border)"}`, background: isSel ? "var(--green-xlt)" : "var(--surface)" }}>
                <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: finished ? "var(--green)" : `${c}18` }}>
                  {finished ? <Check size={16} className="text-white" /> : <span className="text-[14px] font-extrabold" style={{ color: c }}>{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-t1 truncate">{e.name}</div>
                  <div className="text-[12px] text-t2">{e.group} · {done}/{all} {t("gym.app.common.sets")}</div>
                </div>
                {isCur && <Badge color="green">{t("gym.app.exec.badge_current")}</Badge>}
                {paused && <Badge color="orange">{t("gym.app.exec.badge_paused")}</Badge>}
                {finished && !isCur && <Badge color="gray">{t("gym.app.exec.badge_done")}</Badge>}
              </button>
            );
          })}
        </div>
        {/* Confirmar troca */}
        <div className="mt-4">
          {pickSel === current ? (
            <Button fullWidth size="lg" onClick={() => setShowPicker(false)}>{t("gym.app.exec.continue_current")}</Button>
          ) : (
            <>
              {sets.some((s) => s.done) && !sets.every((s) => s.done) && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-3 text-[12.5px] font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
                  <Pause size={15} style={{ color: "#92400E" }} /> “{ex.name}” {t("gym.app.exec.pause_hint_suffix")}
                </div>
              )}
              <Button fullWidth size="lg" onClick={() => jumpTo(pickSel)} icon={<Play size={17} className="text-white" fill="currentColor" />}>{t("gym.app.exec.start_new_exercise")}</Button>
            </>
          )}
        </div>
      </Modal>

      {/* Finish modal */}
      <Modal open={showFinish} onClose={() => setShowFinish(false)} title={t("gym.app.exec.finish_workout")}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-brand-xlt flex items-center justify-center mx-auto mb-5">
            <Trophy size={36} className="text-brand" />
          </div>
          <div className="text-xl font-black text-t1 mb-1.5">{t("gym.app.exec.well_done")} 💪</div>
          <div className="text-[14px] text-t2 mb-5">{t("gym.app.exec.finish_summary_prefix")} {completedSets} {t("gym.app.common.of")} {totalSets} {t("gym.app.exec.sets_in")} {Math.floor(elapsed / 60)} {t("gym.app.exec.minutes")}.</div>
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {[
              { v: `${Math.floor(elapsed / 60)}min`, l: t("gym.app.exec.stat_duration") },
              { v: completedSets, l: t("gym.app.exec.target_sets") },
            ].map((s, i) => (
              <div key={i} className="bg-bg rounded-xl py-3.5 px-2">
                <div className="text-[22px] font-black text-t1">{s.v}</div>
                <div className="text-[11px] text-t2">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            <Button fullWidth size="lg" disabled={createLog.isPending} onClick={finishWorkout}>{createLog.isPending ? t("gym.app.common.saving") : t("gym.app.exec.finish_now")}</Button>
            <Button fullWidth variant="danger" onClick={discard}>{t("gym.app.exec.cancel_workout")}</Button>
            <Button fullWidth variant="ghost" onClick={() => setShowFinish(false)}>{t("gym.app.exec.keep_training")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

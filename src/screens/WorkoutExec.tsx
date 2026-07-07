import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronDown, Trophy, Timer, Minus, Plus, Dumbbell, ArrowDown, Flag } from "lucide-react";
import { useActiveWorkout } from "../store/useActiveWorkout";
import { useCreateLog } from "../hooks/useGym";
import { Button, Modal } from "../components/ui";
import { formatClock } from "../lib/format";
import { groupColor } from "../lib/exercises";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";
import { useCms } from "../context/CmsContext";
import { useStatusBarColor } from "../hooks/useStatusBarColor";

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return startedAt ? Math.floor((now - startedAt) / 1000) : 0;
}

/**
 * Pede o Screen Wake Lock (mantém o ecrã aceso) e devolve uma função para o
 * libertar. Feature-detect (`'wakeLock' in navigator`) — ignora silenciosamente
 * em browsers sem suporte (ex.: iOS Safari <16.4) ou se o pedido for recusado
 * (ex.: bateria fraca).
 */
async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if (!("wakeLock" in navigator)) return null;
  try {
    return await navigator.wakeLock.request("screen");
  } catch {
    return null;
  }
}

const round2 = (v: number) => Math.round(v * 100) / 100;

// Hex reais do token `--dark` (index.css) por tema — o header (`bg-ink`) já é
// sempre escuro nos dois temas da app, mas com um hex ligeiramente diferente
// por tema (light: #15171b · dark: #070809). Passar o par exato (em vez de um
// valor único) dá um encaixe perfeito com a status bar em AMBOS os temas —
// zero "costura" no topo do ecrã de treino.
const HEADER_INK_LIGHT = "#15171b";
const HEADER_INK_DARK = "#070809";

export function WorkoutExec() {
  const navigate = useNavigate();
  const { t } = useCms();
  const wk = useActiveWorkout();
  const elapsed = useElapsed(wk.startedAt);

  // Status bar do dispositivo acompanha o header sempre-escuro (sem "costura").
  useStatusBarColor(HEADER_INK_LIGHT, HEADER_INK_DARK);

  // Descanso/pausa: vive no store persistido (sobrevive a fechar/reabrir a app).
  // `endsAt` é wall-clock (epoch ms) — os segundos restantes derivam-se sempre
  // de `endsAt - now`, nunca de um contador decremental (esse congela em
  // background). `now` só existe para forçar o re-render a cada segundo.
  const rest = wk.rest;
  const resting = !!rest;
  const [now, setNow] = useState(() => Date.now());
  const restLeft = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
  const restTotal = rest?.total ?? 60;
  const restKind = rest?.kind ?? "normal";
  const restMsg = rest?.msg ?? "";

  const [showFinish, setShowFinish] = useState(false);
  const createLog = useCreateLog();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Fim do descanso → conclui a série guardada e avança (no store).
  const resolveRest = () => wk.finishRest();

  useEffect(() => {
    if (!wk.workoutId) navigate("/treinos", { replace: true });
  }, [wk.workoutId, navigate]);

  // Ticker do descanso: só corre enquanto há descanso em curso — força um
  // re-render por segundo para `restLeft` ser recalculado a partir de `endsAt`.
  useEffect(() => {
    if (!resting) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resting]);

  // Ao chegar a 0 (mesmo vindo de um salto grande, ex.: 2 min em background
  // com um descanso de 60s), resolve já — avança para a próxima série/exercício.
  useEffect(() => {
    if (!resting) return;
    if (restLeft <= 0) resolveRest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting, restLeft]);

  // Screen Wake Lock: mantém o ecrã aceso só enquanto o treino está a decorrer
  // (este ecrã montado). O browser LIBERTA o wake lock sozinho quando a página
  // vai para background — por isso o mesmo handler de `visibilitychange` que
  // re-sincroniza o descanso volta também a pedi-lo ao ficar visível.
  useEffect(() => {
    requestWakeLock().then((s) => { wakeLockRef.current = s; });
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  // Um único handler para as duas coisas ao voltar a ficar visível (reabrir a
  // app depois de background/ecrã bloqueado): (1) recalcula o descanso já,
  // sem esperar pelo próximo tick do interval acima; (2) readquire o wake lock.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setNow(Date.now());
      if (!wakeLockRef.current) requestWakeLock().then((s) => { wakeLockRef.current = s; });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  if (!wk.workoutId || wk.exercises.length === 0) return null;

  const current = wk.currentIndex;
  const totalEx = wk.exercises.length;
  const ex = wk.exercises[current];
  const sets = ex.sets;

  // ── Duas posições (brief §3): ATUAL (sequência) vs SELECIONADA (vista) ──
  // currentSetIdx = 1.ª série `!done && !skipped` — a que o CTA conclui e
  // sobre a qual corre o descanso. -1 quando não há nenhuma pendente (só
  // possível aqui via "Dar exercício como concluído", que marca tudo `done`
  // sem avançar `currentIndex`).
  const currentSetIdx = sets.findIndex((s) => !s.done && !s.skipped);
  const hasPending = currentSetIdx !== -1;

  // selectedSetIdx = índice de VISTA — por omissão acompanha o atual; só muda
  // ao clicar num botão de série (nunca avança a sequência).
  const selRaw = wk.selectedSet[current];
  const selectedSetIdx = Math.min(Math.max(selRaw ?? (hasPending ? currentSetIdx : 0), 0), sets.length - 1);
  const selected = sets[selectedSetIdx];
  const curSet = hasPending ? sets[currentSetIdx] : null;

  const completedSets = wk.doneSets();
  const totalSets = wk.totalSets();
  const isLastEx = current === totalEx - 1;
  const isTime = ex.type === "time";

  const color = groupColor(ex.group);

  // willFinishEx = concluir a série ATUAL esgota as pendentes do exercício
  // (contando as já saltadas, que também "saem da sequência").
  const doneOrSkipped = sets.filter((s) => s.done || s.skipped).length;
  const willFinishEx = hasPending && doneOrSkipped + 1 >= sets.length;

  // Card de fim de exercício (FIX 2, review overhaul): distingue "concluído de
  // facto" (todas `done`) de "terminado com saltos" (há ≥1 `skipped`) — skip≠done,
  // o texto/visual triunfante não pode aparecer quando na verdade faltou fazer
  // alguma série. Mesmo critério dos dots de progresso por exercício (abaixo).
  const exDoneCount = sets.filter((s) => s.done).length;
  const exSkippedCount = sets.filter((s) => s.skipped).length;
  const exFullyDone = exDoneCount === sets.length;

  // ── Drop set (modelo achatado): a série ATUAL é um "passo" de um dropset. ──
  const isDropStep = !!curSet && curSet.dropStep != null;
  const dropTotal = curSet?.dropTotal ?? 0;
  const isLastDropStep = !isDropStep || (curSet?.dropStep ?? 1) >= dropTotal;

  // Steppers/referência do último treino editam/mostram sempre a SELECIONADA.
  // Uma série já `done`/`skipped` fica só-leitura (dá para rever, não para
  // editar em silêncio o que já foi para o log — FIX 3, review overhaul).
  const selectedLocked = selected.done || selected.skipped;
  const updateField = (field: "weight" | "reps" | "duration", delta: number) => {
    if (selectedLocked) return;
    wk.updateSet(current, selectedSetIdx, { [field]: Math.max(0, round2(selected[field] + delta)) });
  };

  // Conclui o passo ATUAL e arranca o descanso. O avanço para a próxima
  // série/passo só acontece quando o descanso termina (resolveRest).
  const completeAndRest = () => {
    if (!hasPending || !curSet) return;
    const exIdx = current, sIdx = currentSetIdx;
    const setEntry = curSet;

    // Último passo do treino → conclui já, sem descanso.
    if (willFinishEx && isLastEx) {
      wk.setDone(exIdx, sIdx, true);
      setShowFinish(true);
      return;
    }

    // Texto "A seguir: …" (por extenso) e tipo de descanso (drop = mini-descanso).
    let kind: "normal" | "drop" = "normal";
    let msg: string;
    if (isDropStep && !isLastDropStep) {
      kind = "drop";
      msg = `${t("gym.app.exec.dropset_label") || "Dropset"} ${(setEntry.dropStep ?? 1) + 1}/${dropTotal}`;
    } else if (willFinishEx) {
      const nextName = wk.exercises[exIdx + 1]?.name || t("gym.app.exec.next_up_exercise") || "próximo exercício";
      msg = `${t("gym.app.exec.next_up") || "A seguir"}: ${nextName}`;
    } else {
      const np = sets.findIndex((s, i) => i !== sIdx && !s.done && !s.skipped);
      const n = (np !== -1 ? np : sIdx + 1) + 1;
      msg = `${t("gym.app.exec.next_up") || "A seguir"}: ${t("gym.app.exec.series_label") || "Série"} ${n} ${t("gym.app.common.of") || "de"} ${sets.length}`;
    }

    const restDur = setEntry.rest ?? ex.rest;
    if (restDur > 0) {
      // Guarda o descanso no store (a série a concluir/avançar fica em exIdx/setIdx);
      // o avanço acontece quando o descanso termina (finishRest). O store calcula
      // `endsAt` a partir de `total` (wall-clock).
      wk.startRest({ total: restDur, kind, msg, exIdx, setIdx: sIdx });
    } else {
      wk.advanceAfterSet(exIdx, sIdx); // sem descanso → avança já
    }
  };

  // Marca as séries PENDENTES do exercício como concluídas (não avança sozinho —
  // fica no exercício, mostra o resumo; "Próximo Exercício" avança). Nunca toca
  // nas já `done` nem nas `skipped` — evita o conflito `{done:true, skipped:true}`
  // que fazia o contador e o log divergirem (FIX 1, review overhaul).
  const completeExercise = () => {
    wk.cancelRest();
    sets.forEach((s, si) => {
      if (!s.done && !s.skipped) wk.setDone(current, si, true);
    });
  };

  // Salta a série ATUAL (fica por fazer — nunca done). Avança a sequência. Se
  // isto esgotar as pendentes do ÚLTIMO exercício (treino inteiro terminado —
  // mesmo critério de `completeAndRest`: `willFinishEx && isLastEx`), abre o
  // resumo de fim de treino (FIX 7, review overhaul).
  const skipCurrentSet = () => {
    if (!hasPending) return;
    const willFinishWorkout = willFinishEx && isLastEx;
    wk.skipSet(current, currentSetIdx);
    if (willFinishWorkout) setShowFinish(true);
  };

  // Salta o exercício inteiro (pendentes ficam por fazer). Avança já para o
  // próximo (ou, se for o último, abre o resumo de fim de treino).
  const skipCurrentExercise = () => {
    const wasLast = isLastEx;
    wk.skipExercise(current);
    if (wasLast) setShowFinish(true);
  };

  // Ver/editar outra série (não avança a sequência, não altera done/skipped).
  const selectSet = (si: number) => {
    wk.setSelectedSet(current, si);
  };

  const goNext = () => {
    if (current < totalEx - 1) wk.setIndex(current + 1);
    else setShowFinish(true);
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

  // Subtítulo do CTA "FAZER AGORA" (orientado à ação, como no protótipo). A
  // série ATUAL mantém sempre a border azul a piscar, mesmo quando estás a
  // ESPREITAR outra série (`selectedSetIdx !== currentSetIdx`) — mas o botão
  // continua a concluir a ATUAL, por isso o subtítulo deixa isso explícito
  // nesse caso (FIX 4, review overhaul); no caso comum (vista = atual) não
  // acrescenta nada de novo.
  const ctaSub = isDropStep && !isLastDropStep
    ? (t("gym.app.exec.cta_sub_drop") || "Terminei o drop · baixar peso")
    : willFinishEx && isLastEx
      ? (t("gym.app.exec.cta_sub_finish") || "Terminei · concluir treino")
      : (t("gym.app.exec.cta_sub_rest") || "Terminei a série · descansar");
  const ctaSubFull = hasPending && selectedSetIdx !== currentSetIdx
    ? `${ctaSub} · ${t("gym.app.exec.cta_completes_set") || "conclui série"} ${currentSetIdx + 1}`
    : ctaSub;

  return (
    <div className="h-[100dvh] bg-bg flex flex-col overflow-hidden">
      {/* ── Header escuro com cronómetro grande (shrink-0: 1º filho do flex) ── */}
      <div className="shrink-0 bg-ink px-[18px] pb-3.5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
        <div className="flex items-center justify-between mb-1">
          <button onClick={minimize} title={t("gym.app.exec.minimize")} className="w-[38px] h-[38px] rounded-[11px] bg-white/10 flex items-center justify-center"><ChevronDown size={20} className="text-white" /></button>
          <div className="text-[13px] font-bold text-white/85 truncate max-w-[55%]">{wk.name}</div>
          <button onClick={() => setShowFinish(true)} className="px-[15px] py-[9px] rounded-[11px] bg-brand text-white text-[13px] font-extrabold">{t("gym.app.exec.finish")}</button>
        </div>
        {/* Tempo a correr */}
        <div className="flex flex-col items-center gap-0.5 pt-1.5 pb-0.5">
          <div className="flex items-center gap-[7px]">
            <span className="w-[9px] h-[9px] rounded-full animate-pulse" style={{ background: resting ? "#F97316" : "var(--green)" }} />
            <span className="text-[11px] font-extrabold tracking-[0.14em]" style={{ color: resting ? "#FBBF77" : "rgba(255,255,255,0.55)" }}>{resting ? t("gym.app.exec.state_resting") : t("gym.app.exec.state_training")}</span>
          </div>
          <div className="text-[48px] font-black text-white leading-none tnum tracking-[-0.02em]">{formatClock(elapsed)}</div>
          <div className="text-[12.5px] text-white/50 font-medium">{completedSets}/{totalSets} {t("gym.app.exec.sets_done")}</div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="shrink-0 h-1 bg-line">
        <div className="h-full bg-gradient-to-r from-brand to-brand-dk transition-[width] duration-500" style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} />
      </div>

      {/* Conteúdo do meio: cresce, e só ele scrolla (nunca o documento) se um
          exercício tiver demasiadas séries para caber. */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 py-3 lg:px-6 lg:py-4 w-full max-w-[520px] mx-auto">
        {/* Posição do exercício */}
        <div className="flex items-center justify-between w-full mb-2.5">
          <span className="text-[13px] font-bold text-t2">{t("gym.app.exec.exercise_label")} {current + 1} {t("gym.app.common.of")} {totalEx}</span>
          <div className="flex gap-[5px]">
            {wk.exercises.map((e, i) => {
              const eDone = e.sets.every((s) => s.done);
              return <span key={i} className="h-2 rounded-full transition-all duration-200" style={{ width: i === current ? 22 : 8, background: i === current ? "var(--green)" : eDone ? "var(--green-dk)" : "var(--border)" }} />;
            })}
          </div>
        </div>

        <div key={current} className={`w-full animate-fadeIn rounded-card ${hasPending && !resting ? "go-border" : ""}${hasPending && resting ? "rest-border" : ""}`}>
          <div className="bg-surface rounded-card shadow-card overflow-hidden">
            <div className="p-4 lg:p-5">
              {/* Grupo + nome */}
              <div className="flex items-center gap-[7px] mb-1.5">
                <span className="w-[9px] h-[9px] rounded-full" style={{ background: color }} />
                <span className="text-[12px] font-extrabold uppercase tracking-[0.06em]" style={{ color }}>{ex.group}</span>
              </div>
              <div className="text-[24px] font-black text-t1 leading-[1.05] tracking-[-0.03em] mb-3">{ex.name}</div>

              {/* ── Pontos de série: ATUAL (azul a piscar) vs SELECIONADA (ring estático) ── */}
              {hasPending && (
                <div className="mb-3">
                  <span className="block text-[12.5px] font-bold text-t3 mb-1.5">{t("gym.app.exec.target_sets")}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sets.map((s, si) => {
                      const isCurrent = si === currentSetIdx;
                      const isSelected = si === selectedSetIdx && !isCurrent;
                      return (
                        <button key={si} onClick={() => selectSet(si)} title={s.dropStep ? `${t("gym.app.exec.dropset_label") || "Dropset"} · ${t("gym.app.exec.step_label") || "passo"} ${s.dropStep}/${s.dropTotal}` : `${t("gym.app.exec.series_label")} ${si + 1}`}
                          className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all relative ${isCurrent ? "set-current-pulse" : ""}`}
                          style={{
                            background: s.done ? "var(--green)" : (isCurrent || isSelected) ? "var(--surface)" : "var(--bg)",
                            boxShadow: isCurrent
                              ? undefined
                              // Estático (nunca pisca — distinto do azul-a-piscar da ATUAL) mas com
                              // contraste suficiente em dark, onde `--border` fica quase invisível
                              // sobre `--surface` (FIX 5, review overhaul).
                              : isSelected
                                ? "inset 0 0 0 2px var(--t2)"
                                : s.dropStep && !s.done ? "inset 0 0 0 1.5px #F9731788" : "none",
                            opacity: s.skipped ? 0.55 : 1,
                          }}>
                          {s.done ? <Check size={15} className="text-white" /> : (
                            <span className={`text-[13.5px] font-extrabold ${s.skipped ? "line-through" : ""}`} style={{ color: isCurrent ? "var(--now)" : s.dropStep ? "#C2742B" : "var(--t3)" }}>{si + 1}</span>
                          )}
                          {s.dropStep != null && !s.done && !s.skipped && <span className="absolute -top-1 -right-1 text-[9px] font-black" style={{ color: "#F97316" }}>↓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Steppers (mostram/editam a série SELECIONADA; visíveis também durante o descanso) ── */}
              {hasPending && (
                <>
                  <div className="flex items-stretch bg-bg rounded-[18px] overflow-hidden mb-2">
                    {(isTime
                      ? [{ label: t("gym.app.exec.duration_label") || "Duração (s)", field: "duration" as const, step: 5, val: selected.duration }]
                      : [
                          { label: t("gym.app.exec.weight_label"), field: "weight" as const, step: 2.5, val: selected.weight },
                          { label: t("gym.app.exec.reps_label"), field: "reps" as const, step: 1, val: selected.reps },
                        ]
                    ).map((f, fi) => (
                      <div key={f.field} className="flex-1 flex">
                        {fi === 1 && <div className="w-px bg-line my-3" />}
                        <div className="flex-1 flex flex-col items-center gap-2 pt-3 pb-3.5 px-1.5">
                          <span className="text-[11px] font-extrabold text-t3 tracking-[0.07em]">{f.label}</span>
                          <div className="flex items-center gap-2 w-full">
                            <button onClick={() => updateField(f.field, -f.step)} disabled={selectedLocked} className={`w-[34px] h-[34px] rounded-full bg-surface shadow-card flex items-center justify-center transition shrink-0 ${selectedLocked ? "opacity-40" : "active:scale-95"}`}><Minus size={15} className="text-t2" /></button>
                            <span className="flex-1 min-w-0 text-[clamp(20px,6vw,30px)] font-black text-t1 text-center tnum tracking-[-0.02em]">{f.val}</span>
                            <button onClick={() => updateField(f.field, f.step)} disabled={selectedLocked} className={`w-[34px] h-[34px] rounded-full bg-brand flex items-center justify-center transition shrink-0 ${selectedLocked ? "opacity-40" : "active:scale-95"}`}><Plus size={15} className="text-white" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Referência discreta: valor do último treino para a série SELECIONADA */}
                  {(isTime ? selected.lastDuration != null : selected.lastWeight != null) && (
                    <div className="text-center text-[11.5px] text-t3 font-medium mb-1.5">
                      {t("gym.app.exec.last_short") || "Último"}: {isTime ? `${selected.lastDuration}s` : `${selected.lastWeight}kg · ${selected.lastReps} ${t("gym.app.common.reps")}`}
                    </div>
                  )}

                  {/* Ações secundárias — compactas, uma linha (nunca durante o descanso) */}
                  {!resting && (
                    <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-[12.5px] font-semibold text-t3">
                      <button onClick={skipCurrentSet} className="px-1 py-0.5 active:text-t2 transition-colors">{t("gym.app.exec.skip_set") || "Saltar série"}</button>
                      <span>·</span>
                      <button onClick={skipCurrentExercise} className="px-1 py-0.5 active:text-t2 transition-colors">{t("gym.app.exec.skip_exercise") || "Saltar exercício"}</button>
                      {sets.length > 1 && (
                        <>
                          <span>·</span>
                          <button onClick={completeExercise} className="px-1 py-0.5 active:text-t2 transition-colors">{t("gym.app.exec.mark_exercise_done") || "Concluir exercício"}</button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {!hasPending && exFullyDone && (
                <div className="text-center py-1">
                  <div className="w-[60px] h-[60px] rounded-full bg-brand-xlt flex items-center justify-center mx-auto mt-1 mb-3.5">
                    <Check size={28} className="text-brand" />
                  </div>
                  <div className="text-[16px] font-extrabold text-t1 mb-1">{t("gym.app.exec.exercise_done")}</div>
                  <div className="text-[14px] text-t2">{t("gym.app.exec.ex_done_prefix")} {sets.length} {t("gym.app.exec.ex_done_suffix")}</div>
                </div>
              )}

              {/* Terminado com saltos (skip≠done — nunca o check verde triunfal aqui). */}
              {!hasPending && !exFullyDone && (
                <div className="text-center py-1">
                  <div className="w-[60px] h-[60px] rounded-full bg-bg flex items-center justify-center mx-auto mt-1 mb-3.5">
                    <Flag size={26} className="text-t3" />
                  </div>
                  <div className="text-[16px] font-extrabold text-t1 mb-1">{t("gym.app.exec.ex_ended_title") || "Exercício terminado"}</div>
                  <div className="text-[14px] text-t2">
                    {t("gym.app.exec.ex_ended_prefix") || "Terminaste com"} {exDoneCount} {t("gym.app.common.of") || "de"} {sets.length} {t("gym.app.exec.ex_ended_suffix") || "séries feitas"}, {exSkippedCount} {t("gym.app.exec.ex_ended_skipped_suffix") || "saltadas."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──── BARRA DO CTA (shrink-0, último filho do flex — sempre no fundo) ──── */}
      <div className="shrink-0 bg-surface/95 backdrop-blur-xl border-t border-line" style={{ padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-[520px] mx-auto w-full">
          {/* Próximo / Terminar (exercício concluído — via "Dar exercício como concluído") */}
          {!hasPending && (
            <Button fullWidth size="lg" onClick={goNext} className="!h-[96px] !rounded-[20px] text-[17px]"
              icon={isLastEx ? <Trophy size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}>
              {isLastEx ? t("gym.app.exec.finish_workout") : t("gym.app.exec.next_exercise")}
            </Button>
          )}

          {/* FAZER AGORA (verde, toca para concluir a série ATUAL + descansar) */}
          {hasPending && !resting && (
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
                  <div className="text-[13.5px] font-bold text-white/90 mt-[5px] truncate">{ctaSubFull}</div>
                </div>
                {isDropStep
                  ? <div className="shrink-0 text-white text-[10px] font-black tracking-[0.05em] px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.22)" }}>{t("gym.app.exec.drop_short") || "DROP"} {curSet?.dropStep}/{dropTotal}</div>
                  : <ChevronRight size={22} className="text-white" />}
              </div>
            </button>
          )}

          {/* DESCANSO (laranja, toca para saltar) — "A seguir: …" trunca com reticências + tempo sempre legível */}
          {hasPending && resting && (
            <button onClick={resolveRest} title={t("gym.app.exec.rest_skip_hint")} className="w-full h-[96px] box-border border-none cursor-pointer rounded-[20px] px-[18px] relative overflow-hidden animate-fadeIn"
              style={{ background: "#FFF7ED", boxShadow: "inset 0 0 0 1.5px #F9731833" }}>
              <div className="relative h-full flex items-center gap-3.5">
                <div className="w-[58px] h-[58px] rounded-[17px] shrink-0 flex items-center justify-center" style={{ background: "#F97316", animation: "breathe 1.6s ease-in-out infinite" }}>
                  {restKind === "drop" ? <ArrowDown size={28} className="text-white" /> : <Timer size={28} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  {/* A dica "toca para saltar" nunca partilha o nó truncado da mensagem
                      "A seguir: …" (um nome de exercício comprido engolia-a) — fica na
                      linha do rótulo, como fragmento que não trunca (FIX 6, review overhaul). */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12px] font-extrabold tracking-[0.1em]" style={{ color: "#F97316" }}>{restKind === "drop" ? (t("gym.app.exec.rest_drop_label") || "BAIXA O PESO") : t("gym.app.exec.rest_label")}</span>
                    <span className="shrink-0 text-[10.5px] font-bold" style={{ color: "#C2742B99" }}>· {t("gym.app.exec.rest_skip_hint")}</span>
                  </div>
                  <div className="text-[13px] font-bold mt-[3px] truncate min-w-0" style={{ color: "#C2742B" }}>{restMsg || t("gym.app.exec.rest_label")}</div>
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

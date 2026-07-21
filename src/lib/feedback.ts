/**
 * Feedback sensorial no fim do descanso: vibração + som curto.
 * Chamado APENAS quando o descanso termina sozinho (não em finishRest manual/navegação).
 */

let audioCtx: AudioContext | null = null;

/**
 * Inicializa o AudioContext lazy (no primeiro gesto do utilizador).
 * O browser bloqueia AudioContext sem interação prévia — por isso o contexto
 * só é criado e usado quando é acionado, nunca no arranque.
 */
function ensureAudioContext(): AudioContext | null {
  if (!audioCtx) {
    try {
      // Use AudioContext ou webkitAudioContext (Safari compatibilidade).
      const Ctx = typeof AudioContext !== "undefined" ? AudioContext : (window as any).webkitAudioContext;
      if (Ctx) {
        audioCtx = new Ctx();
      }
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Vibração + beep duplo (~880Hz, ~150ms cada, 100ms entre) no fim do descanso.
 * Sem fallback silencioso em caso de erro — o utilizador não fica bloqueado.
 */
export function restEndFeedback() {
  try {
    // Vibração (3 pulsos curtos: 200ms on, 100ms off, 200ms on)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Silenciar erros de vibração
  }

  try {
    // Beep duplo via Web Audio API
    const ctx = ensureAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      // AudioContext foi suspenso — resume silenciosamente (não causa som sem interação)
      ctx.resume().catch(() => {});
      return;
    }

    const now = ctx.currentTime;
    const freq = 880; // Hz
    const duration = 0.15; // segundos
    const gap = 0.1; // gap entre beeps

    // Beep 1
    const osc1 = ctx.createOscillator();
    const env1 = ctx.createGain();
    osc1.frequency.value = freq;
    osc1.connect(env1);
    env1.connect(ctx.destination);
    env1.gain.setValueAtTime(0.3, now);
    env1.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc1.start(now);
    osc1.stop(now + duration);

    // Beep 2
    const startTime2 = now + duration + gap;
    const osc2 = ctx.createOscillator();
    const env2 = ctx.createGain();
    osc2.frequency.value = freq;
    osc2.connect(env2);
    env2.connect(ctx.destination);
    env2.gain.setValueAtTime(0.3, startTime2);
    env2.gain.exponentialRampToValueAtTime(0.01, startTime2 + duration);
    osc2.start(startTime2);
    osc2.stop(startTime2 + duration);
  } catch {
    // Silenciar erros de Web Audio
  }
}

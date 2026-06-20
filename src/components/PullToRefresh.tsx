import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

// Pull-to-refresh próprio (mesma abordagem do projeto "futebol"): no PWA
// instalado o Android desativa o "puxar para atualizar" nativo, por isso
// reimplementamos o gesto à mão com listeners no window.
//
// O conteúdo NÃO se desloca (o header é sticky e fica fixo). A bolinha é um
// overlay `fixed` que nasce por baixo do header (altura medida) e desce com o
// puxão. Ao disparar, invalidamos as queries do React Query.

const THRESHOLD = 64; // px (com resistência) para disparar
const MAX = 96; // limite visual do arrasto
const RESIST = 0.5; // resistência do puxão

export function PullToRefresh() {
  const qc = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const set = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 4 || e.touches.length !== 1) {
        startY.current = null;
        return;
      }
      // mede o header sticky para a bolinha arrancar logo por baixo dele
      const header = document.querySelector("header");
      setHeaderH(header ? header.getBoundingClientRect().height : 0);
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null || busy.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 4) {
        if (pullRef.current) set(0);
        setDragging(false);
        return;
      }
      setDragging(true);
      set(Math.min(MAX, dy * RESIST));
      if (e.cancelable) e.preventDefault(); // suprime o scroll nativo durante o puxão
    };
    const onEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      setDragging(false);
      if (pullRef.current >= THRESHOLD) {
        busy.current = true;
        setRefreshing(true);
        set(THRESHOLD);
        try {
          await Promise.all([
            qc.invalidateQueries(),
            new Promise((r) => setTimeout(r, 600)), // chão mínimo de animação
          ]);
        } catch {
          /* ignora */
        }
        busy.current = false;
        setRefreshing(false);
        set(0);
      } else {
        set(0);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [qc]);

  const p = refreshing ? THRESHOLD : pull;
  if (p <= 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 z-[15] flex justify-center"
      style={{
        // arranca por baixo do header (translateY >= 0, nunca sobrepõe a barra)
        top: headerH,
        transform: `translateY(${p}px)`,
        opacity: Math.min(1, p / 24),
        transition: dragging ? "none" : "transform 0.25s ease, opacity 0.2s ease",
      }}
    >
      <div className="grid h-9 w-9 place-items-center rounded-full bg-surface shadow-md">
        <RefreshCw
          size={18}
          className={`text-brand ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${(p / THRESHOLD) * 270}deg)` }}
        />
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

// Pull-to-refresh próprio — o overscroll nativo está desligado (index.css),
// por isso replicamos o gesto: ao puxar para baixo no topo da página,
// invalidamos as queries do React Query (refaz os dados visíveis).
//
// O conteúdo NÃO se desloca (o header é sticky e tem de ficar fixo). A bolinha
// nasce por baixo do header (medido em tempo real) e desce com o arrasto; o
// header, opaco e com z-index maior, tapa-a enquanto ela está encostada.

const TRIGGER = 70; // px (com resistência) para disparar o refresh
const MAX = 100; // limite visual do arrasto
const SPIN = 46; // offset mantido (abaixo do header) enquanto atualiza

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY > 0) return; // só quando já estamos no topo
    // mede o header sticky para a bolinha começar logo por baixo dele
    const header = containerRef.current?.querySelector("header");
    setHeaderH(header ? header.getBoundingClientRect().height : 0);
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(MAX, dy * 0.5)); // resistência
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (pull >= TRIGGER && !refreshing) {
      setRefreshing(true);
      setPull(SPIN);
      try {
        await qc.invalidateQueries();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const progress = Math.min(1, pull / TRIGGER);

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Bolinha — nasce por baixo do header (z-10 < header z-20) e desce. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
        style={{
          top: headerH,
          transform: `translateY(${pull - 44}px)`,
          opacity: refreshing ? 1 : progress,
          transition: dragging ? "none" : "transform 0.25s ease, opacity 0.2s ease",
        }}
      >
        <div className="grid h-9 w-9 place-items-center rounded-full bg-surface shadow-md">
          <RefreshCw
            size={18}
            className={`text-brand ${refreshing ? "animate-spin" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

// Pull-to-refresh próprio — o overscroll nativo está desligado (index.css),
// por isso replicamos o gesto: ao puxar para baixo no topo da página,
// invalidamos as queries do React Query (refaz os dados visíveis).

const TRIGGER = 70; // px (com resistência) para disparar o refresh
const MAX = 100; // limite visual do arrasto
const SPIN = 48; // altura mantida enquanto atualiza

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY > 0) return; // só quando já estamos no topo
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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Indicador — segue o arrasto e roda conforme o progresso. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
        style={{
          transform: `translateY(${pull - 38}px)`,
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

      {/* Conteúdo deslocado para baixo enquanto se puxa. */}
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

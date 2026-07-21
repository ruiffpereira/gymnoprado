import { useEffect } from "react";
import { useSession } from "../store/useSession";
import { usePendingLogs, drainPendingLogs } from "../store/usePendingLogs";
import { toast } from "../lib/toast";
import { useCms } from "../context/CmsContext";

/**
 * Drena a fila offline de logs de treino nos três momentos combinados:
 * arranque da app (com sessão), evento `online` e `visibilitychange`→visível.
 * Só corre autenticado (o POST /logs exige Bearer). Ao conseguir enviar,
 * avisa discretamente — a invalidação do histórico/dashboard acontece dentro
 * do próprio `drainPendingLogs`.
 *
 * O toast "Treino enviado" só dispara quando o drain esvazia completamente
 * os itens do utilizador atual (sent > 0 && restantes === 0); num parcial
 * (sent > 0 && restantes > 0) não há toast — o banner continua visível.
 */
export function usePendingLogsSync() {
  const status = useSession((s) => s.status);
  const profile = useSession((s) => s.profile);
  const items = usePendingLogs((s) => s.items);
  const { t } = useCms();

  useEffect(() => {
    if (status !== "authed") return;
    let disposed = false;

    const run = async () => {
      const sent = await drainPendingLogs();
      if (sent > 0 && !disposed) {
        // Toast só se a fila do utilizador atual ficou vazia.
        const currentUserId = profile?.id;
        const remaining = items.filter((i) => i.ownerId === currentUserId && (i.failCount ?? 0) < 3).length;
        if (remaining === 0) {
          toast.success(t("gym.app.sync.synced") || "Treino enviado — histórico atualizado.");
        }
      }
    };

    run(); // arranque / login
    const onOnline = () => { run(); };
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // `t` fora das deps de propósito: mudar de língua não deve re-armar os listeners.
    // `items` e `profile` em deps para recalcular o remaining na hora.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, profile?.id, items]);
}

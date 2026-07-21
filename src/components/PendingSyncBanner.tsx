import { CloudUpload, Trash2 } from "lucide-react";
import { useSession } from "../store/useSession";
import { useCms } from "../context/CmsContext";
import { usePendingLogs, drainPendingLogs } from "../store/usePendingLogs";
import { toast } from "../lib/toast";

/**
 * Aviso discreto no Dashboard (mesmo padrão do MensalidadeBanner) quando há
 * treinos guardados no telemóvel à espera de rede. Toca → tenta enviar já.
 * Some sozinho quando a fila esvazia.
 *
 * Estados:
 * - "Treino guardado": itens pendentes, tenable via toque para retry
 * - "Erro de sincronização": itens com failCount >= 3; ações "Descartar" e "Tentar de novo"
 */
export function PendingSyncBanner() {
  const { t } = useCms();
  const profile = useSession((s) => s.profile);
  const items = usePendingLogs((s) => s.items);
  const remove = usePendingLogs((s) => s.remove);
  const resetFailCount = usePendingLogs((s) => s.resetFailCount);

  const currentUserId = profile?.id;
  if (!currentUserId) return null;

  // Itens do utilizador atual que não estão em erro.
  const pending = items.filter((i) => i.ownerId === currentUserId && (i.failCount ?? 0) < 3);
  // Itens do utilizador atual que estão em erro (failCount >= 3).
  const errored = items.filter((i) => i.ownerId === currentUserId && (i.failCount ?? 0) >= 3);

  if (pending.length === 0 && errored.length === 0) return null;

  const retry = async () => {
    const sent = await drainPendingLogs();
    if (sent > 0) {
      const remaining = items.filter((i) => i.ownerId === currentUserId && (i.failCount ?? 0) < 3).length;
      if (remaining === 0) {
        toast.success(t("gym.app.sync.synced") || "Treino enviado — histórico atualizado.");
      }
    }
  };

  const discardAll = () => {
    errored.forEach((item) => remove(item.clientUuid));
  };

  const retryFailed = () => {
    errored.forEach((item) => resetFailCount(item.clientUuid));
    retry();
  };

  // Estado de erro: itens com failCount >= 3.
  if (errored.length > 0) {
    return (
      <div
        className="w-full mb-5 rounded-card px-4 py-3 flex items-center gap-3 text-left animate-fadeIn"
        style={{ background: "var(--red-xlt, #FEE8E8)", boxShadow: "inset 0 0 0 1.5px var(--red, #EC4C47)" }}
      >
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-lt">
          <CloudUpload size={18} className="text-red-dk" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-t1">
            {t("gym.app.sync.error_title") || "Não foi possível enviar"} {errored.length > 1 ? `${errored.length}` : "o"} {errored.length === 1 ? "registo" : "registos"}
          </p>
          <p className="text-[12px] text-t2 truncate">
            {t("gym.app.sync.error_sub") || "Toca para tentar de novo ou descartar."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={discardAll}
            className="p-1.5 rounded-lg bg-white/20 text-t1 hover:bg-white/30 active:scale-95 transition"
            title={t("gym.app.sync.discard") || "Descartar"}
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={retryFailed}
            className="px-3 py-1.5 rounded-lg bg-red text-white text-[12px] font-bold hover:bg-red-dk active:scale-95 transition"
          >
            {t("gym.app.sync.retry") || "Tentar"}
          </button>
        </div>
      </div>
    );
  }

  // Estado normal: itens pendentes.
  return (
    <button
      onClick={retry}
      className="w-full mb-5 rounded-card px-4 py-3 flex items-center gap-3 text-left animate-fadeIn"
      style={{ background: "var(--green-xlt, #F3FAEA)", boxShadow: "inset 0 0 0 1.5px var(--green, #8DC63F)" }}
    >
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-brand-lt">
        <CloudUpload size={18} className="text-brand-dk" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-t1">
          {t("gym.app.sync.pending_title") || "Treino guardado no telemóvel"}{pending.length > 1 ? ` (${pending.length})` : ""}
        </p>
        <p className="text-[12px] text-t2 truncate">
          {t("gym.app.sync.pending_sub") || "Será enviado quando houver ligação — toca para tentar já."}
        </p>
      </div>
    </button>
  );
}

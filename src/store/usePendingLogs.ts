import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PostWebsitesGymLogsMutationRequest as LogInput } from "../gen/types/PostWebsitesGymLogs";
import { createLog } from "../api";
import { isTransientApiError } from "../api/client";
import { uuid } from "../lib/format";
import { queryClient } from "../lib/queryClient";
import { invalidateGym } from "../hooks/useGym";
import { useSession } from "./useSession";

/**
 * Fila offline de logs de treino (persistida em localStorage, mesmo padrão
 * zustand+persist do treino ativo). Quando o `POST /logs` falha por causa
 * TRANSITÓRIA (sem rede, timeout, 5xx), o log completo entra aqui e é drenado
 * mais tarde — no arranque da app, ao voltar `online` e ao voltar a ficar
 * visível. O reenvio é seguro: cada log leva o `clientUuid` gerado no início
 * do treino e a API dedupa por `(customerId, clientUuid)`.
 *
 * Cada log enfileirado guarda também o `ownerId` (id do customer autenticado no
 * momento). O drain só envia itens cujo `ownerId` === customer atual; os outros
 * ficam na fila intactos (nunca são limpos no logout — o dono pode voltar a
 * entrar e recuperá-los).
 */
export interface PendingLog {
  /** O mesmo `clientUuid` que segue dentro de `log` — chave da fila e do dedupe. */
  clientUuid: string;
  log: LogInput;
  queuedAt: number;
  /** ID do utilizador autenticado que enfileirou este log. */
  ownerId?: string;
  /** Contagem de falhas definitivas. Com >= 3, entra em erro. */
  failCount?: number;
}

interface PendingLogsState {
  items: PendingLog[];
  enqueue: (log: LogInput) => void;
  remove: (clientUuid: string) => void;
  incrementFailCount: (clientUuid: string) => void;
  resetFailCount: (clientUuid: string) => void;
}

export const usePendingLogs = create<PendingLogsState>()(
  persist(
    (set) => ({
      items: [],
      enqueue: (log) =>
        set((s) => {
          const clientUuid = log.clientUuid ?? uuid();
          const withUuid: LogInput = { ...log, clientUuid };
          // Substitui um item com o mesmo uuid (retry manual do mesmo treino)
          // em vez de o duplicar na fila.
          const rest = s.items.filter((i) => i.clientUuid !== clientUuid);
          // Captura o id do utilizador autenticado no momento do enqueue.
          const ownerId = useSession.getState().profile?.id;
          return { items: [...rest, { clientUuid, log: withUuid, queuedAt: Date.now(), ownerId, failCount: 0 }] };
        }),
      remove: (clientUuid) =>
        set((s) => ({ items: s.items.filter((i) => i.clientUuid !== clientUuid) })),
      incrementFailCount: (clientUuid) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.clientUuid === clientUuid ? { ...i, failCount: (i.failCount ?? 0) + 1 } : i
          ),
        })),
      resetFailCount: (clientUuid) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.clientUuid === clientUuid ? { ...i, failCount: 0 } : i
          ),
        })),
    }),
    { name: "gymnoprado_pending_logs", version: 1 },
  ),
);

let draining = false;

/**
 * Tenta enviar todos os logs pendentes do utilizador autenticado atual, por ordem
 * de chegada. Devolve quantos seguiram. Nunca lança: numa falha transitória
 * (continua sem rede) pára e fica para a próxima; numa falha definitiva (4xx)
 * incrementa failCount — com >= 3 entra em erro definitivo (não reentado
 * automaticamente, requer ação do user). Logs de outro utilizador/sem ownerId
 * ficam intactos.
 *
 * Os gatilhos são discretos (arranque/online/visível/toque no aviso), por isso
 * não há loop quente.
 */
export async function drainPendingLogs(): Promise<number> {
  if (draining) return 0;
  const { items } = usePendingLogs.getState();
  if (items.length === 0) return 0;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;

  const currentUserId = useSession.getState().profile?.id;
  if (!currentUserId) return 0;

  draining = true;
  let sent = 0;
  try {
    for (const item of [...items]) {
      // Só drena logs do utilizador atual. Logs sem ownerId (legacy) ou de outro
      // utilizador ficam intactos.
      if (item.ownerId !== currentUserId) continue;

      // Falha definitiva com failCount >= 3 fica para o user descartar.
      if ((item.failCount ?? 0) >= 3) continue;

      try {
        // 200 (dedupe: já existia) e 201 contam ambos como enviado.
        await createLog(item.log);
        usePendingLogs.getState().remove(item.clientUuid);
        sent++;
      } catch (e) {
        if (isTransientApiError(e)) break; // continua offline — parar já

        // Falha definitiva (4xx): incrementa failCount. Com >= 3 entra em erro.
        usePendingLogs.getState().incrementFailCount(item.clientUuid);
      }
    }
  } finally {
    draining = false;
  }
  if (sent > 0) invalidateGym(queryClient);
  return sent;
}

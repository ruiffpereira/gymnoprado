import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@kubb/plugin-client/clients/axios";

/**
 * Mensalidade do membro (só-leitura). Fala com `GET /websites/gym/mensalidade`.
 * Hook manual (não gerado pelo Kubb) para não depender de regenerar o spec — usa
 * o mesmo `axiosInstance` partilhado (baseURL + Bearer + refresh já configurados
 * em `src/api/client.ts`).
 */

export type MensalidadeStatus = "paid" | "debt" | "unpaid";

export interface MemberPayment {
  paymentId: string | null;
  period: string; // "YYYY-MM"
  amount: number;
  dueDate: string; // "YYYY-MM-DD"
  status: MensalidadeStatus;
  paidAt: string | null;
  method: string | null;
  notes: string | null;
  paidAmount: number | null;
  debtSince: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  /** Derivado: não pago e já passou o vencimento. */
  overdue: boolean;
}

export interface MensalidadeSubscription {
  subscriptionId: string;
  name: string;
  price: number;
  dueDay: number;
  active: boolean;
}

export interface MensalidadeResponse {
  subscription: MensalidadeSubscription | null;
  blocked: boolean;
  currentPeriod: string;
  today: string;
  current: MemberPayment | null;
  history: MemberPayment[];
}

export const mensalidadeQueryKey = ["websites-gym-mensalidade"] as const;

export function useMensalidade() {
  return useQuery({
    queryKey: mensalidadeQueryKey,
    queryFn: async () => {
      const res = await axiosInstance.get<MensalidadeResponse>("/websites/gym/mensalidade");
      return res.data;
    },
    staleTime: 60_000,
  });
}

/** "por pagar" | "em atraso" | "paga" — estado visível, derivado do pagamento. */
export type MensalidadeView = "paid" | "due" | "overdue";

export function viewOf(p: MemberPayment | null | undefined): MensalidadeView | null {
  if (!p) return null;
  if (p.status === "paid") return "paid";
  return p.overdue ? "overdue" : "due";
}

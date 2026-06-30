import { Wallet, Banknote, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Card, Badge } from "./ui";
import { useCms } from "../context/CmsContext";
import { useMensalidade, viewOf, type MemberPayment, type MensalidadeView } from "../hooks/useMensalidade";

const eur = (n: number) => n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
const monthLabel = (period: string) => {
  try {
    return format(parseISO(`${period}-01`), "MMMM yyyy", { locale: pt });
  } catch {
    return period;
  }
};

function StateBadge({ view }: { view: MensalidadeView }) {
  const { t } = useCms();
  if (view === "paid") return <Badge color="green">{t("gym.app.mensalidade.paid") || "Paga"}</Badge>;
  if (view === "overdue") return <Badge color="red">{t("gym.app.mensalidade.overdue") || "Em atraso"}</Badge>;
  return <Badge color="orange">{t("gym.app.mensalidade.due") || "Por pagar"}</Badge>;
}

function HistoryRow({ p }: { p: MemberPayment }) {
  const view = viewOf(p);
  return (
    <li className="flex items-center justify-between py-2 border-t border-line first:border-t-0">
      <span className="text-[13px] text-t2 capitalize">{monthLabel(p.period)}</span>
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] text-t3 tnum">{eur(p.amount)}</span>
        {view && <StateBadge view={view} />}
      </div>
    </li>
  );
}

/** Secção de mensalidade no Perfil (só-leitura). */
export function MensalidadeCard() {
  const { t } = useCms();
  const { data, isLoading } = useMensalidade();

  if (isLoading) {
    return (
      <Card className="p-4 mb-5">
        <div className="h-5 w-32 bg-bg rounded animate-pulse" />
      </Card>
    );
  }
  if (!data) return null;

  const { subscription, current, history, blocked } = data;
  const title = t("gym.app.mensalidade.title") || "Mensalidade";

  if (!subscription) {
    return (
      <Card className="p-4 mb-5">
        <p className="text-sm font-bold text-t1 mb-1 flex items-center gap-2">
          <Wallet size={16} className="text-brand" /> {title}
        </p>
        <p className="text-[13px] text-t3">
          {t("gym.app.mensalidade.empty") || "Ainda sem mensalidade ativa — fala com o teu treinador."}
        </p>
      </Card>
    );
  }

  const view = viewOf(current);

  return (
    <Card className="p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-t1 flex items-center gap-2">
          <Wallet size={16} className="text-brand" /> {title}
        </p>
        {view && <StateBadge view={view} />}
      </div>

      {/* Subscrição + mês corrente */}
      <div className="rounded-xl bg-bg p-3.5 mb-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-extrabold text-t1 truncate">{subscription.name}</span>
          <span className="text-[15px] font-black text-t1 tnum shrink-0">{eur(current?.amount ?? subscription.price)}</span>
        </div>
        <p className="text-[12px] text-t3 mt-0.5 capitalize">
          {(t("gym.app.mensalidade.due_day") || "Vence dia {d}").replace("{d}", String(subscription.dueDay))}
          {current ? ` · ${monthLabel(current.period)}` : ""}
        </p>
        {view === "paid" && current?.paidAt ? (
          <p className="text-[12px] text-t2 mt-1.5">
            {(t("gym.app.mensalidade.paid_on") || "Paga a {d}").replace(
              "{d}",
              format(parseISO(current.paidAt), "d 'de' MMMM", { locale: pt }),
            )}
          </p>
        ) : (
          <p className="text-[12px] text-t3 mt-1.5 flex items-center gap-1.5">
            <Banknote size={13} /> {t("gym.app.mensalidade.cash_hint") || "Pagamento em dinheiro, ao balcão."}
          </p>
        )}
      </div>

      {blocked && (
        <div
          className="rounded-xl px-3.5 py-2.5 mb-3 flex items-center gap-2 text-[12.5px] font-medium"
          style={{ background: "#FEF2F2", color: "#B91C1C" }}
        >
          <Lock size={14} /> {t("gym.app.mensalidade.blocked") || "Mensalidade suspensa. Regulariza para continuar."}
        </div>
      )}

      {history.length > 0 && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wide text-t3 mb-0.5">
            {t("gym.app.mensalidade.history") || "Histórico"}
          </p>
          <ul className="flex flex-col">
            {history.map((p) => (
              <HistoryRow key={p.period} p={p} />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

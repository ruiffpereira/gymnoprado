import { useNavigate } from "react-router-dom";
import { Wallet, ChevronRight } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { useMensalidade, viewOf } from "../hooks/useMensalidade";

const eur = (n: number) => n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

/**
 * Aviso discreto no Dashboard quando a mensalidade do mês corrente está por pagar
 * ou em atraso. Some quando paga. Toca → vai ao Perfil (secção Mensalidade).
 */
export function MensalidadeBanner() {
  const navigate = useNavigate();
  const { t } = useCms();
  const { data } = useMensalidade();
  const current = data?.current;
  const view = viewOf(current);
  if (!current || !view || view === "paid") return null;

  const overdue = view === "overdue";
  return (
    <button
      onClick={() => navigate("/perfil")}
      aria-label={overdue ? t("gym.app.mensalidade.banner_overdue") : t("gym.app.mensalidade.banner_due")}
      className={`w-full mb-5 rounded-card px-4 py-3 flex items-center gap-3 text-left animate-fadeIn ${
        overdue
          ? "bg-red/10 dark:bg-red/20 border border-red/30 dark:border-red/50"
          : "bg-orange/10 dark:bg-orange/20 border border-orange/30 dark:border-orange/50"
      }`}
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        overdue
          ? "bg-red/20 dark:bg-red/30"
          : "bg-orange/20 dark:bg-orange/30"
      }`}>
        <Wallet size={18} className={overdue ? "text-red" : "text-orange"} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-bold ${overdue ? "text-red" : "text-orange"}`}>
          {overdue
            ? t("gym.app.mensalidade.banner_overdue") || "Mensalidade em atraso"
            : t("gym.app.mensalidade.banner_due") || "Mensalidade por pagar"}
        </p>
        <p className={`text-[12px] truncate ${overdue ? "text-red" : "text-orange"}`}>
          {eur(current.amount)} · {t("gym.app.mensalidade.cash_hint") || "Pagamento em dinheiro, ao balcão."}
        </p>
      </div>
      <ChevronRight size={18} className={`shrink-0 ${overdue ? "text-red" : "text-orange"}`} />
    </button>
  );
}

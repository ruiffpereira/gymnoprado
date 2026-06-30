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
      role="status"
      aria-live="polite"
      className="w-full mb-5 rounded-card px-4 py-3 flex items-center gap-3 text-left animate-fadeIn"
      style={overdue ? { background: "#FEF2F2", boxShadow: "inset 0 0 0 1.5px #FCA5A5" } : { background: "#FFF7ED", boxShadow: "inset 0 0 0 1.5px #FED7AA" }}
    >
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: overdue ? "#FECACA" : "#FFE4C4" }}>
        <Wallet size={18} style={{ color: overdue ? "#B91C1C" : "#C2410C" }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold" style={{ color: overdue ? "#991B1B" : "#9A3412" }}>
          {overdue
            ? t("gym.app.mensalidade.banner_overdue") || "Mensalidade em atraso"
            : t("gym.app.mensalidade.banner_due") || "Mensalidade por pagar"}
        </p>
        <p className="text-[12px] truncate" style={{ color: overdue ? "#B91C1C" : "#C2410C" }}>
          {eur(current.amount)} · {t("gym.app.mensalidade.cash_hint") || "Pagamento em dinheiro, ao balcão."}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0" style={{ color: overdue ? "#B91C1C" : "#C2410C" }} />
    </button>
  );
}

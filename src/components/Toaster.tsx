import { Check, AlertCircle } from "lucide-react";
import { useToastStore } from "../lib/toast";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-btn bg-surface shadow-lg border border-line animate-slideUp max-w-sm w-full"
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.type === "success" ? "bg-brand-lt text-brand-dk" : "bg-red/15 text-red"}`}>
            {t.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
          </span>
          <span className="text-sm font-medium text-t1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../store/useTheme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  if (compact) {
    return (
      <button onClick={toggle} aria-label="Alternar tema" className="w-10 h-10 rounded-xl bg-surface shadow-card flex items-center justify-center">
        {dark ? <Sun size={19} className="text-brand" /> : <Moon size={19} className="text-t2" />}
      </button>
    );
  }

  return (
    <button onClick={toggle} className="flex items-center justify-between w-full p-1 rounded-pill border border-line bg-bg">
      <span className="flex items-center gap-2 pl-2.5 text-[13px] font-semibold text-t2">
        {dark ? <Moon size={16} className="text-brand" /> : <Sun size={16} className="text-orange" />}
        {dark ? "Modo Escuro" : "Modo Claro"}
      </span>
      <span className={`w-11 h-6 rounded-pill relative transition-colors ${dark ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-[left] ${dark ? "left-[23px]" : "left-[3px]"}`} />
      </span>
    </button>
  );
}

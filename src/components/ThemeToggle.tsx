import { Sun, Moon, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../store/useTheme";
import { useCms } from "../context/CmsContext";
import type { ThemeMode } from "../store/useTheme";

const THEME_ICON: Record<ThemeMode, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();
  const { t } = useCms();

  const modes = [
    { id: "light" as ThemeMode, label: t("gym.app.theme.light") || "Claro", icon: Sun },
    { id: "dark" as ThemeMode, label: t("gym.app.theme.dark") || "Escuro", icon: Moon },
    { id: "system" as ThemeMode, label: t("gym.app.theme.system") || "Sistema", icon: Monitor },
  ];

  if (compact) {
    // Botão único que cicla Claro → Escuro → Sistema; o ícone reflecte o modo actual.
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    const Icon = THEME_ICON[mode];
    return (
      <button
        onClick={() => setMode(next)}
        aria-label={t("gym.app.theme.toggle_label") || "Alternar tema"}
        className="w-10 h-10 rounded-xl bg-surface shadow-card flex items-center justify-center"
      >
        <Icon size={19} className={mode === "light" ? "text-orange" : mode === "dark" ? "text-brand" : "text-t2"} />
      </button>
    );
  }

  return (
    <div className="flex gap-1 p-1 rounded-pill border border-line bg-bg">
      {modes.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-pill text-[12px] font-semibold transition-colors ${
              active ? "bg-surface text-t1 shadow-card" : "text-t3 hover:text-t2"
            }`}
          >
            <m.icon size={15} className={active ? "text-brand" : ""} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

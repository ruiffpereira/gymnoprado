import { create } from "zustand";

type Theme = "light" | "dark";
const KEY = "gymnoprado_theme";

function resolveInitial(): Theme {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0D0F12" : "#8DC63F");
}

/** Aplica o tema guardado o mais cedo possível (chamado em main.tsx). */
export function applyStoredTheme() {
  apply(resolveInitial());
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: resolveInitial(),
  setTheme: (theme) => {
    apply(theme);
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, theme);
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));

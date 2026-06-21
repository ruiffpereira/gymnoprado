import { create } from "zustand";
import { setStatusBarTheme } from "../lib/statusBar";

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
  // A cor da status bar respeita as cores do ecrã activo (ver lib/statusBar).
  setStatusBarTheme(theme);
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

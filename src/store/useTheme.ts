import { create } from "zustand";
import { setStatusBarTheme } from "../lib/statusBar";

// Modo escolhido pelo utilizador. "system" segue o tema do dispositivo em tempo real
// (ex.: muda sozinho ao pôr do sol, se o telemóvel estiver em automático).
export type ThemeMode = "light" | "dark" | "system";
type Theme = "light" | "dark";
const KEY = "gymnoprado_theme";

function systemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function storedMode(): ThemeMode {
  if (typeof localStorage !== "undefined") {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  }
  return "system"; // default: seguir o dispositivo
}

/** Tema concreto (claro/escuro) a aplicar, dado o modo escolhido. */
function resolve(mode: ThemeMode): Theme {
  return mode === "system" ? systemTheme() : mode;
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  // A cor da status bar respeita as cores do ecrã activo (ver lib/statusBar).
  setStatusBarTheme(theme);
}

/** Aplica o tema guardado o mais cedo possível (chamado em main.tsx). */
export function applyStoredTheme() {
  apply(resolve(storedMode()));
}

interface ThemeState {
  mode: ThemeMode;
  /** Tema efectivamente aplicado (já resolvido a partir do modo). */
  theme: Theme;
  setMode: (m: ThemeMode) => void;
}

export const useTheme = create<ThemeState>((set) => {
  const mode = storedMode();

  // Segue o dispositivo em tempo real enquanto o modo for "system".
  if (typeof window !== "undefined" && window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", (e) => {
      if (useTheme.getState().mode !== "system") return;
      const theme: Theme = e.matches ? "dark" : "light";
      apply(theme);
      set({ theme });
    });
  }

  return {
    mode,
    theme: resolve(mode),
    setMode: (mode) => {
      const theme = resolve(mode);
      apply(theme);
      if (typeof localStorage !== "undefined") localStorage.setItem(KEY, mode);
      set({ mode, theme });
    },
  };
});

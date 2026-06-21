import { create } from "zustand";
import { useLayoutEffect } from "react";
import type { ReactNode } from "react";

export interface HeaderConfig {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}

interface HeaderState {
  config: HeaderConfig;
  set: (c: HeaderConfig) => void;
}

// Conteúdo do header partilhado. O <ScreenHeader/> vive no Layout e fica montado
// entre tabs (não salta); cada ecrã só declara aqui o que quer mostrar lá dentro.
export const useHeaderStore = create<HeaderState>((set) => ({
  config: { title: "" },
  set: (config) => set({ config }),
}));

/**
 * Um ecrã (tab) declara o conteúdo do header partilhado.
 * Corre em useLayoutEffect (antes do paint) para não haver frame com o título
 * do ecrã anterior ao trocar de tab; sem deps para manter dados vivos
 * (ex.: streak, saudação) sincronizados a cada render.
 */
export function useScreenHeader(config: HeaderConfig) {
  const set = useHeaderStore((s) => s.set);
  useLayoutEffect(() => {
    set(config);
  });
}

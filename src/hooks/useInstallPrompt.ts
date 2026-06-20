import { create } from "zustand";

// Deteção de instalação PWA — mesmo sistema do projeto "futebol":
// Android via `beforeinstallprompt` (prompt nativo), iOS via instruções manuais
// (Safari não dispara o evento). O evento dispara uma única vez por carregamento,
// por isso guardamos o estado num store partilhado (zustand) — qualquer ecrã
// (popup automático ou linha no Perfil) lê o mesmo estado.

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "ios" | "android" | "other";

interface InstallStore {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
  platform: InstallPlatform;
}

const useStore = create<InstallStore>(() => ({
  deferred: null,
  installed: true, // assume escondido até confirmar
  platform: "other",
}));

// Setup único, no carregamento do módulo (apenas no browser).
if (typeof window !== "undefined") {
  const nav = navigator as Navigator & { standalone?: boolean; maxTouchPoints: number };
  const ua = nav.userAgent || "";
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    nav.standalone === true;

  useStore.setState({
    platform: isIOS ? "ios" : isAndroid ? "android" : "other",
    installed: !!standalone,
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useStore.setState({ deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    useStore.setState({ installed: true, deferred: null });
  });
}

export interface InstallInfo {
  /** Telemóvel + não instalada + (iOS ou prompt nativo disponível). */
  canShow: boolean;
  /** Já está a correr como app instalada (standalone). */
  installed: boolean;
  platform: InstallPlatform;
  /** Dispara o prompt nativo do Android/Chrome (no-op no iOS). */
  promptInstall: () => void;
}

export function useInstallPrompt(): InstallInfo {
  const deferred = useStore((s) => s.deferred);
  const installed = useStore((s) => s.installed);
  const platform = useStore((s) => s.platform);

  const promptInstall = () => {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.finally(() => useStore.setState({ deferred: null }));
  };

  // iOS → instruções manuais; restantes → só quando o browser ofereceu o prompt.
  const canShow = !installed && (platform === "ios" || !!deferred);
  return { canShow, installed, platform, promptInstall };
}

import { useEffect } from "react";
import { setScreenStatusBar, resetScreenStatusBar } from "../lib/statusBar";

// Define a cor da status bar (meta theme-color) enquanto o ecrã está montado,
// para fundir a status bar com o topo do ecrã (sem linha de divisão).
// Ao desmontar repõe a cor de fundo por defeito.
//
// A pintura efectiva passa por lib/statusBar (fonte única): assim o toggle de tema
// repinta com estas cores de forma síncrona, em vez de as tapar com o fundo default.
export function useStatusBarColor(light: string, dark = "#0D0F12") {
  useEffect(() => {
    setScreenStatusBar(light, dark);
    return () => resetScreenStatusBar();
  }, [light, dark]);
}

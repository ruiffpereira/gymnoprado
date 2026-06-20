import { useEffect } from "react";
import { useTheme } from "../store/useTheme";

// Define a cor da status bar (meta theme-color) enquanto o ecrã está montado.
// Permite cor diferente por tema; ao desmontar repõe a cor de fundo, para que
// cada ecrã possa fundir a status bar com o seu topo (sem linha de divisão).
export function useStatusBarColor(light: string, dark = "#0D0F12") {
  const theme = useTheme((s) => s.theme);
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", theme === "dark" ? dark : light);
    return () => {
      // repor a cor de fundo (default dos restantes ecrãs / login)
      meta.setAttribute("content", theme === "dark" ? "#0D0F12" : "#F5F7F3");
    };
  }, [theme, light, dark]);
}

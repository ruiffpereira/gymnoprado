// Fonte única de verdade da cor da status bar (meta theme-color).
//
// Antes havia dois donos a escrever a meta: o store do tema (síncrono, no clique)
// e o useStatusBarColor (assíncrono, no effect). No toggle, o tema pintava o fundo
// por defeito e tapava a cor do ecrã → reaparecia a linha de divisão no topo
// (os browsers móveis latcham a cor definida durante o gesto e ignoram o effect tardio).
//
// Agora tudo passa por aqui: o estado guarda as cores do ecrã activo + o tema actual,
// e qualquer mudança (toggle de tema OU montar/desmontar de ecrã) repinta com a
// combinação correcta, de forma síncrona.

type Theme = "light" | "dark";

const DEFAULT = { light: "#F5F7F3", dark: "#0D0F12" } as const;

let colors: { light: string; dark: string } = { ...DEFAULT };
let theme: Theme = "dark";

function paint() {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "dark" ? colors.dark : colors.light);
}

/** Chamado pelo store do tema sempre que o tema muda. */
export function setStatusBarTheme(t: Theme) {
  theme = t;
  paint();
}

/** Um ecrã declara as cores que quer para a status bar enquanto está montado. */
export function setScreenStatusBar(light: string, dark: string) {
  colors = { light, dark };
  paint();
}

/** Repõe as cores de fundo por defeito (ecrã desmontado). */
export function resetScreenStatusBar() {
  colors = { ...DEFAULT };
  paint();
}

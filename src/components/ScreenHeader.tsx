import { useEffect, useState } from "react";
import { useStatusBarColor } from "../hooks/useStatusBarColor";
import { useHeaderStore } from "../store/useHeader";

// Header verde full-bleed que se funde com a status bar (tema claro);
// no tema escuro fica com o fundo normal. Também pinta a status bar de verde
// enquanto está montado, para não haver linha de divisão no topo.
//
// Vive no Layout e fica montado entre tabs (não remonta → não salta). O conteúdo
// (título/subtítulo/right) vem do useHeaderStore, alimentado por cada ecrã.
//
// Em repouso (topo) está fundido com a status bar; ao fazer scroll ganha uma
// sombra + fio subtil na base, para separar do conteúdo que passa por baixo
// (essencial no dark, onde header e fundo têm a mesma cor).
export function ScreenHeader() {
  const { title, subtitle, right } = useHeaderStore((s) => s.config);
  useStatusBarColor("#8DC63F");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-20 border-b bg-brand dark:bg-bg px-5 lg:px-9 pb-6 transition-[box-shadow,border-color] duration-200 ${
        scrolled ? "border-line shadow-md" : "border-transparent"
      }`}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-white dark:text-t1">{title}</h1>
          {subtitle && <p className="text-white/80 dark:text-t2 text-sm">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="absolute bottom-1.5 inset-x-5 lg:inset-x-9">
        <a
          href="https://rufvision.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block max-w-3xl mx-auto text-right text-[9px] font-medium tracking-wide"
        >
          <span className="font-extrabold">
            <span className="text-[#022645] dark:text-[#4f9fe0]">R</span><span className="text-[#F03036]">V</span>
          </span>
          <span className="ml-1 text-white/45 dark:text-t3">Desenvolvido por </span>
          <span className="font-bold">
            <span className="text-[#022645] dark:text-[#4f9fe0]">Ruf</span><span className="text-[#F03036]">Vision</span>
          </span>
        </a>
      </div>
    </header>
  );
}

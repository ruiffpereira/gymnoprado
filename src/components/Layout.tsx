import { NavLink, useLocation } from "react-router-dom";
import { Home, Dumbbell, Clock, BarChart3, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { Logo, Avatar } from "./ui";
import { ThemeToggle } from "./ThemeToggle";
import { PullToRefresh } from "./PullToRefresh";
import { ScreenHeader } from "./ScreenHeader";
import { useSession } from "../store/useSession";

// Rotas com o header verde partilhado (as 5 tabs). Os ecrãs de detalhe/editor
// trazem o seu próprio header e não entram aqui.
const TAB_PATHS = new Set(["/", "/treinos", "/historico", "/progresso", "/perfil"]);

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
  { to: "/historico", label: "Histórico", icon: Clock },
  { to: "/progresso", label: "Progresso", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: User },
];

function SideNav() {
  const profile = useSession((s) => s.profile);
  return (
    <aside className="hidden lg:flex flex-col w-[248px] h-screen sticky top-0 shrink-0 bg-surface border-r border-line px-4 pt-7 pb-6 gap-0.5">
      <div className="px-2.5 mb-7"><Logo /></div>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-[11px] rounded-btn text-sm transition-colors ${isActive ? "bg-brand-lt text-brand-dk font-bold" : "text-t2 font-medium hover:bg-bg"}`
          }
        >
          <n.icon size={19} />
          {n.label}
        </NavLink>
      ))}
      <div className="flex-1" />
      <div className="mb-2.5"><ThemeToggle /></div>
      {profile && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-btn bg-bg">
          <Avatar name={profile.name} size={36} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-t1 truncate">{profile.name}</div>
            <div className="text-[11px] text-t3">Membro Ativo</div>
          </div>
        </div>
      )}
    </aside>
  );
}

function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2 ${isActive ? "text-brand" : "text-t3"}`
          }
        >
          {({ isActive }) => (
            <>
              <n.icon size={22} className={isActive ? "-translate-y-px transition-transform" : "transition-transform"} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{n.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <SideNav />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {TAB_PATHS.has(pathname) && <ScreenHeader />}
        {children}
      </main>
      <PullToRefresh />
      <BottomNav />
    </div>
  );
}

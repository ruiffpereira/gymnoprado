import { useNavigate } from "react-router-dom";
import { LogOut, Dumbbell, Flame, Folder, CalendarDays, Bell, Shield, LifeBuoy, ChevronRight } from "lucide-react";
import { useSummary, usePrograms } from "../api";
import type { GymProgram } from "../api";
import { logout } from "../api/session";
import { useSession } from "../store/useSession";
import { Card, Avatar, Badge, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";
import { InstallRow } from "../components/InstallPrompt";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="p-4 text-center">
      <span className="inline-flex text-brand mb-1.5">{icon}</span>
      <p className="text-xl font-black text-t1 tnum">{value}</p>
      <p className="text-[11px] text-t3">{label}</p>
    </Card>
  );
}

const SETTINGS = [
  { icon: Bell, label: "Notificações" },
  { icon: Shield, label: "Privacidade" },
  { icon: LifeBuoy, label: "Suporte" },
];

export function Profile() {
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const setGuest = useSession((s) => s.setGuest);
  const { data: summary } = useSummary();
  const { data: programsData } = usePrograms();
  const programs = (programsData ?? []) as GymProgram[];

  const memberMonths = profile?.memberSince
    ? Math.max(1, Math.round((Date.now() - new Date(profile.memberSince).getTime()) / (30 * 24 * 3600 * 1000)))
    : 0;

  const doLogout = async () => {
    await logout();
    setGuest();
    navigate("/login", { replace: true });
  };

  return (
    <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto animate-fadeIn">
      <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-t1 mb-4">Perfil</h1>

      {/* Hero */}
      <div className="relative rounded-card bg-ink text-white p-6 mb-5 overflow-hidden">
        <div className="absolute -top-8 -right-6 w-36 h-36 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <Avatar name={profile?.name} size={64} />
          <div className="min-w-0">
            <h2 className="text-xl font-black truncate">{profile?.name}</h2>
            {profile?.memberSince && (
              <p className="text-white/60 text-sm">Membro desde {format(new Date(profile.memberSince), "MMM yyyy", { locale: pt })}</p>
            )}
            <Badge className="mt-1.5">Membro Ativo</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat icon={<Dumbbell size={18} />} value={summary?.totalWorkouts ?? 0} label="Treinos" />
        <Stat icon={<Flame size={18} />} value={summary?.streak ?? 0} label="Streak" />
        <Stat icon={<Folder size={18} />} value={programs.length} label="Planos" />
        <Stat icon={<CalendarDays size={18} />} value={memberMonths} label="Meses" />
      </div>

      {/* Theme */}
      <Card className="p-4 mb-5">
        <ThemeToggle />
      </Card>

      {/* Settings list */}
      <Card className="p-2 mb-5">
        <InstallRow />
        {SETTINGS.map((s) => (
          <button key={s.label} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-bg transition-colors">
            <s.icon size={18} className="text-t2" />
            <span className="flex-1 text-left text-sm font-medium text-t1">{s.label}</span>
            <ChevronRight size={16} className="text-t3" />
          </button>
        ))}
      </Card>

      <Button variant="danger" fullWidth icon={<LogOut size={18} />} onClick={doLogout}>Terminar Sessão</Button>
    </div>
  );
}

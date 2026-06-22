import { useNavigate } from "react-router-dom";
import { LogOut, Dumbbell, Flame, Folder, CalendarDays, Bell, Shield, LifeBuoy, ChevronRight } from "lucide-react";
import { useSummary, usePrograms } from "../api";
import type { GymProgram } from "../api";
import { logout } from "../api/session";
import { useSession } from "../store/useSession";
import { Card, Avatar, Badge, Button } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { InstallRow } from "../components/InstallPrompt";
import { useCms } from "../context/CmsContext";
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
  { icon: Bell, label: "Notificações", cmsKey: "gym.app.profile.notifications" },
  { icon: Shield, label: "Privacidade", cmsKey: "gym.app.profile.privacy" },
  { icon: LifeBuoy, label: "Suporte", cmsKey: "gym.app.profile.support" },
];

export function Profile() {
  const navigate = useNavigate();
  const { t } = useCms();
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

  useScreenHeader({ title: t("gym.app.nav.profile") });

  return (
    <div className="animate-fadeIn">
      <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-card overflow-hidden mb-5 p-6 text-white bg-ink dark:bg-gradient-to-br dark:from-[#26391c] dark:via-[#13200d] dark:to-[#0b1207] shadow-lg">
        <div className="absolute -top-8 -right-6 w-36 h-36 rounded-full bg-brand/25 dark:bg-brand/45 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <Avatar name={profile?.name} size={64} />
          <div className="min-w-0">
            <h2 className="text-xl font-black truncate">{profile?.name}</h2>
            {profile?.memberSince && (
              <p className="text-white/60 text-sm">{t("gym.app.profile.member_since")} {format(new Date(profile.memberSince), "MMM yyyy", { locale: pt })}</p>
            )}
            <Badge className="mt-1.5">{t("gym.app.member_active")}</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat icon={<Dumbbell size={18} />} value={summary?.totalWorkouts ?? 0} label={t("gym.app.profile.stat_workouts")} />
        <Stat icon={<Flame size={18} />} value={summary?.streak ?? 0} label={t("gym.app.profile.stat_streak")} />
        <Stat icon={<Folder size={18} />} value={programs.length} label={t("gym.app.profile.stat_plans")} />
        <Stat icon={<CalendarDays size={18} />} value={memberMonths} label={t("gym.app.profile.stat_months")} />
      </div>

      {/* Língua */}
      <Card className="p-4 mb-5">
        <p className="text-sm font-bold text-t1 mb-2.5">{t("gym.app.profile.language")}</p>
        <LanguageSwitcher />
      </Card>

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
            <span className="flex-1 text-left text-sm font-medium text-t1">{t(s.cmsKey)}</span>
            <ChevronRight size={16} className="text-t3" />
          </button>
        ))}
      </Card>

      <Button variant="danger" fullWidth icon={<LogOut size={18} />} onClick={doLogout}>{t("gym.app.profile.logout")}</Button>
      </div>
    </div>
  );
}

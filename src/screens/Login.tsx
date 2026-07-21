import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { login, fetchProfile } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { useSession } from "../store/useSession";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";
import { useCms } from "../context/CmsContext";

export function Login() {
  const navigate = useNavigate();
  const { t } = useCms();
  const setAuthed = useSession((s) => s.setAuthed);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError(t("gym.app.login.fill_fields"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      const profile = await fetchProfile();
      setAuthed(profile);
      navigate("/", { replace: true });
    } catch (e) {
      setError(apiErrorMessage(e, t("gym.app.login.error")));
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 bg-bg overflow-hidden">
      {/* Fades só a partir de baixo, para o topo bater certo com a status bar. */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-20 w-64 h-64 rounded-full bg-brand/15 blur-3xl" />
      <div className="absolute top-5 right-5"><ThemeToggle compact /></div>

      <div className="relative w-full max-w-[400px] flex flex-col gap-6 animate-slideUp">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-t2 text-[15px]">{t("gym.app.login.tagline")}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4">
          <Input label={t("gym.app.login.email")} type="email" placeholder={t("gym.app.login.email_ph")} value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} autoComplete="email" />
          <div className="relative">
            <Input label={t("gym.app.login.password")} type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} autoComplete="current-password" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 w-10 h-10 flex items-center justify-center text-t2 hover:text-t1"
              aria-label={showPassword ? t("gym.app.login.hide_password") || "Ocultar" : t("gym.app.login.show_password") || "Mostrar"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {error && <p className="text-sm text-red font-medium">{error}</p>}
          <Button size="lg" fullWidth disabled={loading} type="submit">
            {loading ? t("gym.app.login.signing_in") : t("gym.app.login.sign_in")}
          </Button>
        </form>

        <button onClick={() => navigate("/recuperar")} className="text-sm text-t2 hover:text-brand transition-colors text-center">{t("gym.app.login.forgot")}</button>

        <p className="text-center text-[13px] text-t3">
          {t("gym.app.login.no_account")}{" "}
          <button onClick={() => navigate("/registo")} className="text-brand font-semibold">{t("gym.app.login.create_account")}</button>
        </p>
      </div>
    </div>
  );
}

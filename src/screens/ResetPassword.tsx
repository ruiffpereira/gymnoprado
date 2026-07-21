import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { resetPassword } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";
import { useCms } from "../context/CmsContext";

export function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useCms();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.length < 8) {
      setError(t("gym.app.register.err_password"));
      return;
    }
    if (password !== confirm) {
      setError(t("gym.app.reset.err_mismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      toast.success(t("gym.app.reset.success"));
      navigate("/login", { replace: true });
    } catch (e) {
      setError(apiErrorMessage(e, t("gym.app.reset.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 bg-bg overflow-hidden">
      {/* Fades só a partir de baixo, para o topo bater certo com a status bar. */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-20 w-64 h-64 rounded-full bg-brand/15 blur-3xl" />
      <div className="absolute top-5 right-5"><ThemeToggle compact /></div>

      <div className="relative w-full max-w-[400px] flex flex-col gap-6 animate-slideUp">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-t2 text-[15px] text-center">{t("gym.app.reset.tagline")}</p>
        </div>

        {!token ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-red font-medium">{t("gym.app.reset.invalid_link")}</p>
            <p className="text-t2 text-sm leading-relaxed">{t("gym.app.reset.invalid_desc")}</p>
            <Button size="lg" fullWidth onClick={() => navigate("/recuperar")}>{t("gym.app.reset.request_new")}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input label={t("gym.app.reset.new_password")} type="password" placeholder={t("gym.app.register.password_ph")} value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} autoComplete="new-password" />
            <Input label={t("gym.app.reset.confirm_password")} type="password" placeholder={t("gym.app.reset.confirm_ph")} value={confirm} onChange={(e) => setConfirm(e.target.value)} icon={<Lock size={18} />} autoComplete="new-password" />
            {error && <p className="text-sm text-red font-medium">{error}</p>}
            <Button size="lg" fullWidth disabled={loading} type="submit">
              {loading ? t("gym.app.common.saving") : t("gym.app.reset.submit")}
            </Button>
            <button type="button" onClick={() => navigate("/login")} className="text-sm text-t2 hover:text-brand transition-colors text-center">{t("gym.app.auth.back_to_login")}</button>
          </form>
        )}
      </div>
    </div>
  );
}

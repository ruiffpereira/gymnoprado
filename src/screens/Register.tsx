import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone } from "lucide-react";
import { register, fetchProfile } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { useSession } from "../store/useSession";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";
import { useCms } from "../context/CmsContext";

export function Register() {
  const navigate = useNavigate();
  const { t } = useCms();
  const setAuthed = useSession((s) => s.setAuthed);
  const [form, setForm] = useState({ name: "", email: "", contact: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): string | null => {
    if (form.name.trim().length < 2) return t("gym.app.register.err_name");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return t("gym.app.register.err_email");
    if (form.contact.replace(/\D/g, "").length < 9) return t("gym.app.register.err_phone");
    if (form.password.length < 8) return t("gym.app.register.err_password");
    return null;
  };

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError(null);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        contact: form.contact.trim(),
        password: form.password,
      });
      const profile = await fetchProfile();
      setAuthed(profile);
      navigate("/", { replace: true });
    } catch (e) {
      setError(apiErrorMessage(e, t("gym.app.register.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 py-10 bg-bg overflow-hidden">
      {/* Fades só a partir de baixo, para o topo bater certo com a status bar. */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-20 w-64 h-64 rounded-full bg-brand/15 blur-3xl" />
      <div className="absolute top-5 right-5"><ThemeToggle compact /></div>

      <div className="relative w-full max-w-[400px] flex flex-col gap-6 animate-slideUp">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-t2 text-[15px]">{t("gym.app.register.tagline")}</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label={t("gym.app.register.name")} placeholder={t("gym.app.register.name_ph")} value={form.name} onChange={set("name")} icon={<User size={18} />} autoComplete="name" />
          <Input label={t("gym.app.login.email")} type="email" placeholder={t("gym.app.login.email_ph")} value={form.email} onChange={set("email")} icon={<Mail size={18} />} autoComplete="email" />
          <Input label={t("gym.app.register.phone")} type="tel" placeholder={t("gym.app.register.phone_ph")} value={form.contact} onChange={set("contact")} icon={<Phone size={18} />} autoComplete="tel" />
          <Input label={t("gym.app.login.password")} type="password" placeholder={t("gym.app.register.password_ph")} value={form.password} onChange={set("password")} icon={<Lock size={18} />} autoComplete="new-password" />
          {error && <p className="text-sm text-red font-medium">{error}</p>}
          <Button size="lg" fullWidth disabled={loading} type="submit">
            {loading ? t("gym.app.register.creating") : t("gym.app.register.create")}
          </Button>
        </form>

        <p className="text-center text-[13px] text-t3">
          {t("gym.app.register.have_account")}{" "}
          <button onClick={() => navigate("/login")} className="text-brand font-semibold">{t("gym.app.login.sign_in")}</button>
        </p>
      </div>
    </div>
  );
}

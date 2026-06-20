import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone } from "lucide-react";
import { register, fetchProfile } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { useSession } from "../store/useSession";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";

export function Register() {
  const navigate = useNavigate();
  const setAuthed = useSession((s) => s.setAuthed);
  const [form, setForm] = useState({ name: "", email: "", contact: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): string | null => {
    if (form.name.trim().length < 2) return "Indica o teu nome.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Email inválido.";
    if (form.contact.replace(/\D/g, "").length < 9) return "Telemóvel inválido (mín. 9 dígitos).";
    if (form.password.length < 8) return "A palavra-passe precisa de pelo menos 8 caracteres.";
    return null;
  };

  const submit = async () => {
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
      setError(apiErrorMessage(e, "Não foi possível criar a conta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 py-10 bg-bg overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute top-5 right-5"><ThemeToggle compact /></div>

      <div className="relative w-full max-w-[400px] flex flex-col gap-6 animate-slideUp">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-t2 text-[15px]">Cria a tua conta e começa a treinar</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Nome" placeholder="O teu nome" value={form.name} onChange={set("name")} icon={<User size={18} />} />
          <Input label="Email" type="email" placeholder="o-teu@email.pt" value={form.email} onChange={set("email")} icon={<Mail size={18} />} />
          <Input label="Telemóvel" type="tel" placeholder="912 345 678" value={form.contact} onChange={set("contact")} icon={<Phone size={18} />} />
          <Input label="Palavra-passe" type="password" placeholder="Mín. 8 caracteres" value={form.password} onChange={set("password")} icon={<Lock size={18} />} onKeyDown={(e) => e.key === "Enter" && submit()} />
          {error && <p className="text-sm text-red font-medium">{error}</p>}
          <Button size="lg" fullWidth disabled={loading} onClick={submit}>
            {loading ? "A criar conta…" : "Criar Conta"}
          </Button>
        </div>

        <p className="text-center text-[13px] text-t3">
          Já tens conta?{" "}
          <button onClick={() => navigate("/login")} className="text-brand font-semibold">Entrar</button>
        </p>
      </div>
    </div>
  );
}

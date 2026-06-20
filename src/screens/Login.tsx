import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { login, fetchProfile } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { useSession } from "../store/useSession";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";

export function Login() {
  const navigate = useNavigate();
  const setAuthed = useSession((s) => s.setAuthed);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError("Preenche o email e a palavra-passe.");
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
      setError(apiErrorMessage(e, "Não foi possível entrar."));
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
          <p className="text-t2 text-[15px]">A tua jornada começa aqui</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="o-teu@email.pt" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} />
          <Input label="Palavra-passe" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} onKeyDown={(e) => e.key === "Enter" && submit()} />
          {error && <p className="text-sm text-red font-medium">{error}</p>}
          <Button size="lg" fullWidth disabled={loading} onClick={submit}>
            {loading ? "A entrar…" : "Entrar"}
          </Button>
          <button onClick={() => navigate("/recuperar")} className="text-sm text-t2 hover:text-brand transition-colors text-center">Esqueci a palavra-passe</button>
        </div>

        <p className="text-center text-[13px] text-t3">
          Não tens conta?{" "}
          <button onClick={() => navigate("/registo")} className="text-brand font-semibold">Criar conta</button>
        </p>
      </div>
    </div>
  );
}

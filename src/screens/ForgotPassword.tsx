import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Indica um email válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(apiErrorMessage(e, "Não foi possível enviar o email."));
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
          <p className="text-t2 text-[15px] text-center">Recupera o acesso à tua conta</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={48} className="text-brand" />
            <p className="text-t1 text-[15px] font-medium">Email enviado</p>
            <p className="text-t2 text-sm leading-relaxed">
              Se existir uma conta associada a <span className="font-semibold text-t1">{email.trim()}</span>,
              enviámos um link para definires uma nova palavra-passe. Verifica também o spam.
            </p>
            <Button size="lg" fullWidth onClick={() => navigate("/login")}>Voltar a entrar</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="o-teu@email.pt" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} onKeyDown={(e) => e.key === "Enter" && submit()} />
            {error && <p className="text-sm text-red font-medium">{error}</p>}
            <Button size="lg" fullWidth disabled={loading} onClick={submit}>
              {loading ? "A enviar…" : "Enviar link de recuperação"}
            </Button>
            <button onClick={() => navigate("/login")} className="inline-flex items-center justify-center gap-1.5 text-sm text-t2 hover:text-brand transition-colors">
              <ArrowLeft size={15} /> Voltar a entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

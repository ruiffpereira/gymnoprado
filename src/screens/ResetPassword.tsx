import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { resetPassword } from "../api/session";
import { apiErrorMessage } from "../api/client";
import { toast } from "../lib/toast";
import { Logo, Input, Button } from "../components/ui";
import { ThemeToggle } from "../components/ThemeToggle";

export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      setError("A palavra-passe precisa de pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      toast.success("Palavra-passe alterada. Já podes entrar.");
      navigate("/login", { replace: true });
    } catch (e) {
      setError(apiErrorMessage(e, "Não foi possível alterar a palavra-passe."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-bg overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute top-5 right-5"><ThemeToggle compact /></div>

      <div className="relative w-full max-w-[400px] flex flex-col gap-6 animate-slideUp">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-t2 text-[15px] text-center">Define a tua nova palavra-passe</p>
        </div>

        {!token ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-red font-medium">Link inválido ou incompleto.</p>
            <p className="text-t2 text-sm leading-relaxed">Pede um novo link de recuperação a partir do ecrã de entrada.</p>
            <Button size="lg" fullWidth onClick={() => navigate("/recuperar")}>Pedir novo link</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input label="Nova palavra-passe" type="password" placeholder="Mín. 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} />
            <Input label="Confirmar palavra-passe" type="password" placeholder="Repete a palavra-passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} icon={<Lock size={18} />} onKeyDown={(e) => e.key === "Enter" && submit()} />
            {error && <p className="text-sm text-red font-medium">{error}</p>}
            <Button size="lg" fullWidth disabled={loading} onClick={submit}>
              {loading ? "A guardar…" : "Alterar palavra-passe"}
            </Button>
            <button onClick={() => navigate("/login")} className="text-sm text-t2 hover:text-brand transition-colors text-center">Voltar a entrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { Download, Share, SquarePlus, X, Zap, WifiOff, Bell, ChevronRight } from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useCms } from "../context/CmsContext";

// Popup automático de instalação da PWA (mesmo sistema do projeto "futebol"):
// • Android/Chrome → prompt nativo ("Instalar agora")
// • iOS/Safari → instruções manuais em 3 passos
// Só aparece em telemóvel, quando não instalada, e não repete durante uns dias.

const PROMO_KEY = "gymnoprado_install_promo";
const COOLDOWN = 5 * 24 * 3600 * 1000; // 5 dias

function promoSeen() {
  try {
    return Date.now() - Number(localStorage.getItem(PROMO_KEY) || 0) < COOLDOWN;
  } catch {
    return false;
  }
}
function markPromo() {
  try {
    localStorage.setItem(PROMO_KEY, String(Date.now()));
  } catch {
    /* ignora (modo privado) */
  }
}

export function InstallPrompt() {
  const install = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const mobile = install.platform === "ios" || install.platform === "android";

  useEffect(() => {
    if (!mobile || open) return;
    const t = window.setTimeout(() => {
      if (install.canShow && !promoSeen()) setOpen(true);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [mobile, install.canShow, open]);

  const close = () => {
    markPromo();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Sheet onClose={close}>
      {install.platform === "ios" ? (
        <IosSteps onClose={close} />
      ) : (
        <AndroidPrompt
          onInstall={() => {
            install.promptInstall();
            close();
          }}
          onDismiss={close}
        />
      )}
    </Sheet>
  );
}

// ── Linha manual para o Perfil ───────────────────────────────────────────────
// "Instalar app" — só aparece em telemóvel quando ainda não está instalada.
// Android dispara o prompt nativo; iOS abre as instruções.
export function InstallRow() {
  const install = useInstallPrompt();
  const { t } = useCms();
  const [open, setOpen] = useState(false);
  if (!install.canShow) return null;

  const onClick = () => {
    if (install.platform === "ios") setOpen(true);
    else install.promptInstall();
  };

  return (
    <>
      <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-bg transition-colors">
        <Download size={18} className="text-brand" />
        <span className="flex-1 text-left text-sm font-medium text-t1">{t("gym.app.install.profile_row") || "Instalar app"}</span>
        <ChevronRight size={16} className="text-t3" />
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <IosSteps onClose={() => setOpen(false)} />
        </Sheet>
      )}
    </>
  );
}

// ── Bottom sheet ────────────────────────────────────────────────────────────
function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="w-full sm:max-w-lg bg-surface rounded-t-[24px] animate-slideUp"
        style={{ padding: "20px 20px calc(20px + env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ icon, title, sub, onClose }: { icon: ReactNode; title: string; sub: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-[46px] h-[46px] shrink-0 rounded-[14px] bg-brand-xlt text-brand flex items-center justify-center">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-[21px] text-t1 leading-tight">{title}</div>
        <div className="text-[13px] text-t2">{sub}</div>
      </div>
      <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 shrink-0 rounded-full border border-line text-t2 flex items-center justify-center">
        <X size={16} />
      </button>
    </div>
  );
}

// ── Android / Chrome ─────────────────────────────────────────────────────────
function AndroidPrompt({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  const { t } = useCms();
  return (
    <>
      <SheetHeader icon={<Download size={22} />} title={t("gym.app.install.title") || "Instalar a app"} sub={t("gym.app.install.subtitle") || "GYMNOPRADO no teu ecrã principal"} onClose={onDismiss} />
      <div className="flex flex-col gap-2.5 mb-4">
        <Perk icon={<Zap size={16} />} text={t("gym.app.install.perk1_desc") || "Acesso num toque, em ecrã cheio — como uma app normal."} />
        <Perk icon={<WifiOff size={16} />} text={t("gym.app.install.perk2_desc") || "Treina e regista as sessões mesmo sem internet."} />
        <Perk icon={<Bell size={16} />} text={t("gym.app.install.perk3_desc") || "Mais rápida e sem ocupar espaço como uma app da loja."} />
      </div>
      <button onClick={onInstall} className="w-full inline-flex items-center justify-center gap-2 bg-brand text-white font-semibold text-[15px] py-[13px] rounded-btn active:scale-[0.97] transition-transform">
        <Download size={18} /> {t("gym.app.install.now") || "Instalar agora"}
      </button>
      <button onClick={onDismiss} className="w-full mt-2 text-t2 font-medium text-[13.5px] py-2.5">
        {t("gym.app.install.later") || "Agora não"}
      </button>
    </>
  );
}

function Perk({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-7 h-7 shrink-0 rounded-[9px] bg-brand-xlt text-brand flex items-center justify-center">{icon}</span>
      <span className="text-[13.5px] text-t2 leading-snug">{text}</span>
    </div>
  );
}

// ── iOS / Safari ─────────────────────────────────────────────────────────────
function IosSteps({ onClose }: { onClose: () => void }) {
  const { t } = useCms();
  const step = (n: number, text: ReactNode, icon?: ReactNode) => (
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 shrink-0 rounded-full bg-brand-xlt text-brand font-extrabold text-[14px] flex items-center justify-center">{n}</span>
      <span className="flex-1 text-[14px] text-t1 leading-snug">{text}</span>
      {icon && <span className="text-brand flex">{icon}</span>}
    </div>
  );
  return (
    <>
      <SheetHeader icon={<Download size={21} />} title={t("gym.app.install.ios_title") || "Instalar no iPhone / iPad"} sub={t("gym.app.install.ios_subtitle") || "Em 3 passos, no Safari"} onClose={onClose} />
      <div className="grid gap-3.5">
        {step(1, <>{t("gym.app.install.ios_step1") || "Toca no botão Partilhar na barra do Safari"}</>, <Share size={20} />)}
        {step(2, <>{t("gym.app.install.ios_step2") || "Escolhe «Adicionar ao ecrã principal»"}</>, <SquarePlus size={20} />)}
        {step(3, <>{t("gym.app.install.ios_step3") || "Abre a app pelo novo ícone no ecrã principal"}</>)}
      </div>
      <div className="mt-4 bg-bg border border-line rounded-[11px] px-3.5 py-2.5 text-[12.5px] text-t2 leading-relaxed">
        {t("gym.app.install.ios_note") || "Tem de ser no Safari (não funciona no Chrome do iPhone)."}
      </div>
    </>
  );
}

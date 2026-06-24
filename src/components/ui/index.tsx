import { useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { Dumbbell, X } from "lucide-react";
import { groupColor } from "../../lib/exercises";

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const sz = { sm: { icon: 28, text: "text-[17px]" }, md: { icon: 36, text: "text-[21px]" }, lg: { icon: 52, text: "text-[30px]" } }[size];
  return (
    <div className="flex items-center gap-[11px]">
      <div className="flex items-center justify-center shrink-0 rounded-[28%] bg-brand" style={{ width: sz.icon, height: sz.icon }}>
        <Dumbbell size={sz.icon * 0.58} className="text-white" />
      </div>
      <span className={`font-black tracking-[-0.03em] ${sz.text} ${light ? "text-white" : "text-t1"}`}>
        GYMNO<span className="text-brand">PRADO</span>
      </span>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
type Variant = "primary" | "dark" | "outline" | "ghost" | "danger" | "greenLight" | "surface";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white",
  dark: "bg-ink text-white dark:text-t1",
  outline: "bg-transparent text-brand border-2 border-brand",
  ghost: "bg-transparent text-t2",
  danger: "bg-red text-white",
  greenLight: "bg-brand-lt text-brand-dk",
  surface: "bg-surface text-t1 shadow-card",
};
const SIZE = { sm: "px-4 py-2 text-[13px] rounded-[10px] gap-1.5", md: "px-6 py-3 text-[15px] rounded-btn gap-2", lg: "px-8 py-[17px] text-[17px] rounded-[15px] gap-2.5" };

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
}
export function Button({ children, variant = "primary", size = "md", fullWidth, icon, className = "", ...rest }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-transform duration-100 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-card shadow-card overflow-hidden ${onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}
export function Input({ label, icon, className = "", ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="flex flex-col gap-[7px]">
      {label && <span className="text-[13px] font-semibold text-t2">{label}</span>}
      <div className={`flex items-center gap-2.5 rounded-btn px-4 py-[13px] border-2 transition-colors ${focused ? "border-brand bg-surface" : "border-line bg-bg"}`}>
        {icon && <span className="text-t3 flex">{icon}</span>}
        <input
          className={`flex-1 bg-transparent text-[15px] text-t1 outline-none placeholder:text-t3 ${className}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </div>
    </label>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE: Record<string, string> = {
  green: "bg-brand-lt text-brand-dk",
  gray: "bg-bg text-t2",
  red: "bg-red/15 text-red",
  orange: "bg-orange/15 text-orange",
};
export function Badge({ children, color = "green", className = "" }: { children: ReactNode; color?: "green" | "gray" | "red" | "orange"; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[11px] font-bold tracking-wide ${BADGE[color]} ${className}`}>
      {children}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const initials = name ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  return (
    <div
      className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, background: "linear-gradient(135deg, var(--green), var(--green-dk))" }}
    >
      {initials}
    </div>
  );
}

// ── Modal (bottom sheet) ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, headerAction, children, footer }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg bg-surface rounded-t-[24px] max-h-[90vh] flex flex-col animate-slideUp">
        <div className="flex items-center justify-between gap-2 px-6 pt-5 pb-4 border-b border-line">
          <div className="min-w-0">
            <span className="block text-[17px] font-bold text-t1 truncate">{title}</span>
            {subtitle && <span className="block text-[12px] text-t3 mt-0.5">{subtitle}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerAction}
            <button onClick={onClose} className="w-8 h-8 rounded-[10px] bg-bg flex items-center justify-center">
              <X size={16} className="text-t2" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── Tabs (segmented control) ──────────────────────────────────────────────────
export function Tabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-0.5 p-1 rounded-[14px] bg-bg">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[11px] text-[13px] transition-all ${active === t.id ? "bg-surface text-t1 font-bold shadow-card" : "text-t2 font-medium"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Progress ring ─────────────────────────────────────────────────────────────
export function ProgressRing({ value, max, size = 80, stroke = 7, label, sublabel, color = "var(--green)" }: {
  value: number; max: number; size?: number; stroke?: number; label?: string; sublabel?: string; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(max ? value / max : 0, 0), 1);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--green-xlt)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="font-extrabold text-t1 leading-none" style={{ fontSize: size * 0.22 }}>{label}</span>}
        {sublabel && <span className="text-t2" style={{ fontSize: size * 0.14 }}>{sublabel}</span>}
      </div>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
export function Stepper({ value, onChange, step = 1, min = 0, suffix }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; suffix?: string;
}) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 100) / 100));
  const inc = () => onChange(Math.round((value + step) * 100) / 100);
  return (
    <div className="flex items-center gap-2">
      <button onClick={dec} className="w-9 h-9 rounded-[10px] bg-bg text-t1 text-lg font-bold active:scale-95 transition">−</button>
      <span className="min-w-[3.5rem] text-center font-bold text-t1 tnum">{value}{suffix}</span>
      <button onClick={inc} className="w-9 h-9 rounded-[10px] bg-bg text-t1 text-lg font-bold active:scale-95 transition">+</button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12 gap-4">
      <div className="w-[72px] h-[72px] rounded-full bg-brand-xlt flex items-center justify-center">
        {icon ?? <Dumbbell size={30} className="text-brand" />}
      </div>
      <div>
        <div className="text-lg font-bold text-t1 mb-1.5">{title}</div>
        {subtitle && <div className="text-sm text-t2 leading-relaxed">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Group chip ────────────────────────────────────────────────────────────────
export function GroupChip({ group }: { group: string }) {
  const color = groupColor(group);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-bold" style={{ background: `${color}22`, color }}>
      {group}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className = "" }: { className?: string }) {
  return <div className={`h-7 w-7 rounded-full border-2 border-line border-t-brand animate-spin ${className}`} />;
}

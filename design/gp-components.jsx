// gp-components.jsx — Base UI + Icons + Navigation for GYMNOPRADO

// Brand constants (stay fixed across themes)
const GP = {
  green: '#8DC63F', red: '#EF4444', orange: '#F97316',
  greenDk: '#6BA82E', greenLt: '#EBF6D3', greenXlt: '#F4FAE8',
  bg: '#F5F7F3', white: '#FFFFFF', dark: '#1A1A1E',
  t1: '#1A1A1E', t2: '#6B7280', t3: '#9CA3AF',
  border: '#E5E7EB',
  shadow: '0 2px 16px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.10)',
  shadowLg: '0 12px 48px rgba(0,0,0,0.16)',
  mode: 'light',
};

const LIGHT_THEME = {
  bg: '#F5F7F3', white: '#FFFFFF', dark: '#15171B',
  t1: '#1A1A1E', t2: '#6B7280', t3: '#9CA3AF',
  border: '#E5E7EB', greenDk: '#6BA82E', greenLt: '#EBF6D3', greenXlt: '#F4FAE8',
  shadow: '0 2px 16px rgba(0,0,0,0.07)', shadowMd: '0 4px 24px rgba(0,0,0,0.10)', shadowLg: '0 12px 48px rgba(0,0,0,0.16)',
};
const DARK_THEME = {
  bg: '#0D0F12', white: '#1A1D21', dark: '#070809',
  t1: '#F2F4F1', t2: '#9CA3AB', t3: '#646B72',
  border: '#2A2E34', greenDk: '#A6D65C', greenLt: '#26331A', greenXlt: '#1A2412',
  shadow: '0 2px 18px rgba(0,0,0,0.45)', shadowMd: '0 6px 30px rgba(0,0,0,0.55)', shadowLg: '0 18px 60px rgba(0,0,0,0.65)',
};
function applyGpTheme(mode) {
  Object.assign(GP, mode === 'dark' ? DARK_THEME : LIGHT_THEME);
  GP.mode = mode;
  try { document.body.style.background = GP.bg; document.documentElement.style.colorScheme = mode; } catch (e) {}
}

const AppCtx = React.createContext(null);
const useApp = () => React.useContext(AppCtx);

// ─── ICONS ────────────────────────────────────────────────────────────────────
const GpIcon = {
  Home: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><path d="M9 21V12h6v9"/></svg>,
  Dumbbell: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="10" width="4" height="4" rx="1"/><rect x="18" y="10" width="4" height="4" rx="1"/><rect x="6" y="7" width="4" height="10" rx="1"/><rect x="14" y="7" width="4" height="10" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  Clock: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>,
  Chart: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  User: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Plus: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Back: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevRight: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevDown: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Fire: ({s=22,c='#8DC63F'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32C8.87 6.4 7.85 10.07 9.07 13.22c.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12C7.87 12.33 6.69 10.28 7.45 8.64 5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73C7.08 19.43 8.95 20.67 10.96 20.92c2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6-.2-.52-.5-1-.9-1.52z"/></svg>,
  Timer: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9.5 3.5h5"/><path d="M12 3.5v2"/></svg>,
  Copy: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Trash: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Edit: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Settings: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Camera: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Ruler: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 8.7l-8-8a1 1 0 00-1.4 0l-8 8a1 1 0 000 1.4l8 8a1 1 0 001.4 0l8-8a1 1 0 000-1.4z"/><path d="M8.5 8.5l7 7"/><line x1="10" y1="7" x2="11" y2="8"/><line x1="13" y1="7" x2="14" y2="8"/><line x1="7" y1="10" x2="8" y2="11"/><line x1="7" y1="13" x2="8" y2="14"/></svg>,
  Scale: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="20" height="14" rx="2"/><path d="M16 2l-4 6-4-6"/><line x1="12" y1="14" x2="12" y2="18"/><circle cx="12" cy="13" r="1" fill={c}/></svg>,
  X: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Pause: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  Play: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M5 3l14 9-14 9V3z"/></svg>,
  Trophy: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  ArrowUp: ({s=16,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  ArrowDown: ({s=16,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Minus: ({s=16,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Target: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Zap: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Lock: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Mail: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Sun: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  Moon: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Video: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Image: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Info: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  List: ({s=22,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

// ─── LOGO ───────────────────────────────────────────────────────────────────
const GpLogo = ({ size = 'md', light = false }) => {
  const sz = { sm: { icon: 28, text: 17 }, md: { icon: 36, text: 21 }, lg: { icon: 52, text: 30 } }[size] || { icon: 36, text: 21 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{ width: sz.icon, height: sz.icon, background: GP.green, borderRadius: sz.icon * 0.28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <GpIcon.Dumbbell s={sz.icon * 0.58} c="#fff" />
      </div>
      <span style={{ fontWeight: 900, fontSize: sz.text, letterSpacing: '-0.03em', color: light ? GP.white : GP.t1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        GYMNO<span style={{ color: GP.green }}>PRADO</span>
      </span>
    </div>
  );
};

// ─── BUTTON ─────────────────────────────────────────────────────────────────
const GpBtn = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, fullWidth = false, icon, style: extraStyle }) => {
  const [p, setP] = React.useState(false);
  const sizes = { sm: { padding: '8px 16px', fontSize: 13, borderRadius: 10, gap: 6 }, md: { padding: '13px 24px', fontSize: 15, borderRadius: 13, gap: 8 }, lg: { padding: '17px 32px', fontSize: 17, borderRadius: 15, gap: 10 } }[size];
  const variants = {
    primary: { background: GP.green, color: '#fff', border: 'none' },
    dark: { background: GP.dark, color: GP.white, border: 'none' },
    outline: { background: 'transparent', color: GP.green, border: `2px solid ${GP.green}` },
    ghost: { background: 'transparent', color: GP.t2, border: 'none' },
    danger: { background: GP.red, color: '#fff', border: 'none' },
    greenLight: { background: GP.greenLt, color: GP.greenDk, border: 'none' },
    white: { background: GP.white, color: GP.t1, border: 'none' },
  }[variant] || {};
  return (
    <button onClick={onClick} disabled={disabled} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)} onTouchStart={() => setP(true)} onTouchEnd={() => setP(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : 'auto', transform: p ? 'scale(0.96)' : 'scale(1)', transition: 'transform 0.12s, opacity 0.15s', ...sizes, ...variants, ...extraStyle }}>
      {icon && icon}{children}
    </button>
  );
};

// ─── CARD ────────────────────────────────────────────────────────────────────
const GpCard = ({ children, style, onClick, padded = true, hover = false }) => {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => hover && setH(true)} onMouseLeave={() => hover && setH(false)}
      style={{ background: GP.white, borderRadius: 20, boxShadow: h ? GP.shadowMd : GP.shadow, padding: padded ? 20 : 0, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s, transform 0.2s', transform: h ? 'translateY(-1px)' : 'none', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
};

// ─── INPUT ───────────────────────────────────────────────────────────────────
const GpInput = ({ label, type = 'text', placeholder, value, onChange, icon, onEnter }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: GP.t2, letterSpacing: '0.01em' }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: focused ? GP.white : GP.bg, border: `2px solid ${focused ? GP.green : GP.border}`, borderRadius: 13, padding: '13px 16px', transition: 'all 0.18s' }}>
        {icon && <span style={{ color: GP.t3, display: 'flex' }}>{icon}</span>}
        <input type={type} placeholder={placeholder} value={value} onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && onEnter && onEnter()}
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: GP.t1, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
      </div>
    </div>
  );
};

// ─── BADGE ───────────────────────────────────────────────────────────────────
const GpBadge = ({ children, color = 'green', style: s }) => {
  const c = { green: { bg: GP.greenLt, text: GP.greenDk }, gray: { bg: '#F3F4F6', text: GP.t2 }, red: { bg: '#FEE2E2', text: GP.red }, orange: { bg: '#FEF3C7', text: '#92400E' } }[color] || { bg: GP.greenLt, text: GP.greenDk };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, letterSpacing: '0.02em', ...s }}>{children}</span>;
};

// ─── AVATAR ──────────────────────────────────────────────────────────────────
const GpAvatar = ({ name, size = 40 }) => {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${GP.green}, ${GP.greenDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
      {initials}
    </div>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
const GpEmpty = ({ icon, title, subtitle, action, onAction }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px', gap: 16 }}>
    <div style={{ width: 72, height: 72, borderRadius: '50%', background: GP.greenXlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon || <GpIcon.Dumbbell s={30} c={GP.green} />}
    </div>
    <div><div style={{ fontSize: 18, fontWeight: 700, color: GP.t1, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, color: GP.t2, lineHeight: 1.5 }}>{subtitle}</div>}</div>
    {action && <GpBtn onClick={onAction}>{action}</GpBtn>}
  </div>
);

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
const GpDivider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ flex: 1, height: 1, background: GP.border }} />
    {label && <span style={{ fontSize: 12, color: GP.t3, fontWeight: 500 }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: GP.border }} />
  </div>
);

// ─── PROGRESS RING ───────────────────────────────────────────────────────────
const GpProgressRing = ({ value, max, size = 80, strokeWidth = 7, color, label, sublabel }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const c = color || GP.green;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={GP.greenXlt} strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {label && <span style={{ fontSize: size * 0.22, fontWeight: 800, color: GP.t1, lineHeight: 1 }}>{label}</span>}
        {sublabel && <span style={{ fontSize: size * 0.14, color: GP.t2 }}>{sublabel}</span>}
      </div>
    </div>
  );
};

// ─── MODAL ───────────────────────────────────────────────────────────────────
const GpModal = ({ open, onClose, children, title, maxWidth = 500 }) => {
  if (!open) return null;
  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0', backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up" style={{ background: GP.white, borderRadius: '24px 24px 0 0', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${GP.border}` }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: GP.t1 }}>{title}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: GP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><GpIcon.X s={16} c={GP.t2} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

// ─── TAB BAR (for sub-screens) ───────────────────────────────────────────────
const GpTabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: GP.bg, borderRadius: 14, padding: 4, gap: 2 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, padding: '9px 12px', borderRadius: 11, border: 'none', cursor: 'pointer', background: active === t.id ? GP.white : 'transparent', color: active === t.id ? GP.t1 : GP.t2, fontWeight: active === t.id ? 700 : 500, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: active === t.id ? GP.shadow : 'none', transition: 'all 0.18s' }}>
        {t.label}
      </button>
    ))}
  </div>
);

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────────
const GpBottomNav = ({ screen, navigate }) => {
  const tabs = [
    { id: 'dashboard', icon: GpIcon.Home, label: 'Início' },
    { id: 'workouts', icon: GpIcon.Dumbbell, label: 'Treinos' },
    { id: 'history', icon: GpIcon.Clock, label: 'Histórico' },
    { id: 'progress', icon: GpIcon.Chart, label: 'Progresso' },
    { id: 'profile', icon: GpIcon.User, label: 'Perfil' },
  ];
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: GP.mode === 'dark' ? 'rgba(26,29,33,0.92)' : 'rgba(255,255,255,0.95)', borderTop: `1px solid ${GP.border}`, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom, 6px)', backdropFilter: 'blur(20px)' }}>
      {tabs.map(t => {
        const active = screen === t.id || (screen === 'workoutExec' && t.id === 'workouts');
        return (
          <button key={t.id} onClick={() => navigate(t.id)} style={{ flex: 1, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', cursor: 'pointer', color: active ? GP.green : GP.t3, transition: 'color 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ transform: active ? 'translateY(-1px)' : 'none', transition: 'transform 0.15s' }}><t.icon s={22} c={active ? GP.green : GP.t3} /></div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// ─── THEME TOGGLE ────────────────────────────────────────────────────────────
const GpThemeToggle = ({ compact = false }) => {
  const { theme, toggleTheme } = useApp();
  const dark = theme === 'dark';
  if (compact) {
    return (
      <button onClick={toggleTheme} aria-label="Alternar tema" style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: GP.white, boxShadow: GP.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {dark ? <GpIcon.Sun s={19} c={GP.green} /> : <GpIcon.Moon s={19} c={GP.t2} />}
      </button>
    );
  }
  return (
    <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px', borderRadius: 100, border: `1px solid ${GP.border}`, background: GP.bg, cursor: 'pointer', width: '100%', justifyContent: 'space-between' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, fontSize: 13, fontWeight: 600, color: GP.t2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {dark ? <GpIcon.Moon s={16} c={GP.green} /> : <GpIcon.Sun s={16} c={GP.orange} />}
        {dark ? 'Modo Escuro' : 'Modo Claro'}
      </span>
      <span style={{ width: 44, height: 26, borderRadius: 100, background: dark ? GP.green : GP.border, position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: dark ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </span>
    </button>
  );
};

// ─── SIDE NAV ────────────────────────────────────────────────────────────────
const GpSideNav = ({ screen, navigate, user }) => {
  const tabs = [
    { id: 'dashboard', icon: GpIcon.Home, label: 'Início' },
    { id: 'workouts', icon: GpIcon.Dumbbell, label: 'Os Meus Treinos' },
    { id: 'history', icon: GpIcon.Clock, label: 'Histórico' },
    { id: 'progress', icon: GpIcon.Chart, label: 'Progresso' },
    { id: 'profile', icon: GpIcon.User, label: 'Perfil' },
  ];
  return (
    <aside style={{ width: 248, height: '100vh', position: 'sticky', top: 0, background: GP.white, borderRight: `1px solid ${GP.border}`, display: 'flex', flexDirection: 'column', padding: '28px 16px 24px', gap: 2, flexShrink: 0 }}>
      <div style={{ padding: '0 10px', marginBottom: 28 }}><GpLogo /></div>
      {tabs.map(t => {
        const active = screen === t.id || (screen === 'workoutExec' && t.id === 'workouts');
        return (
          <button key={t.id} onClick={() => navigate(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 13, border: 'none', background: active ? GP.greenLt : 'transparent', color: active ? GP.greenDk : GP.t2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
            <t.icon s={19} c={active ? GP.green : GP.t3} />{t.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ marginBottom: 10 }}><GpThemeToggle /></div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 13, background: GP.bg }}>
          <GpAvatar name={user.name} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: GP.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: GP.t3 }}>Membro Ativo</div>
          </div>
        </div>
      )}
    </aside>
  );
};

// ─── LAYOUT ──────────────────────────────────────────────────────────────────
const GpLayout = ({ children, screen, navigate, user, hideNav }) => {
  const [desk, setDesk] = React.useState(window.innerWidth >= 1024);
  React.useEffect(() => {
    const fn = () => setDesk(window.innerWidth >= 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  if (hideNav) return <div style={{ minHeight: '100dvh', background: GP.bg }}>{children}</div>;
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: GP.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {desk && <GpSideNav screen={screen} navigate={navigate} user={user} />}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: desk ? 0 : 80 }}>{children}</main>
      {!desk && screen !== 'workoutExec' && <GpBottomNav screen={screen} navigate={navigate} />}
    </div>
  );
};

Object.assign(window, { GP, applyGpTheme, AppCtx, useApp, GpIcon, GpLogo, GpBtn, GpCard, GpInput, GpBadge, GpAvatar, GpEmpty, GpDivider, GpProgressRing, GpModal, GpTabBar, GpThemeToggle, GpBottomNav, GpSideNav, GpLayout });

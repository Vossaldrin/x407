import { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 12, overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div style={{
      padding: '14px 18px', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{left}</div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

// ── Stat ──────────────────────────────────────────────────────────────────────
interface StatProps {
  label: string; value: string; delta?: string; deltaUp?: boolean
  accent?: string; style?: CSSProperties
}
export function Stat({ label, value, delta, deltaUp, accent = 'var(--iris)', style }: StatProps) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
      padding: '18px 20px', position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
          background: deltaUp ? 'var(--emerald-dim)' : 'var(--rose-dim)',
          color: deltaUp ? 'var(--emerald)' : 'var(--rose)',
        }}>
          {deltaUp ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeColor = 'iris' | 'emerald' | 'amber' | 'rose' | 'dim'
export function Badge({ children, color = 'dim' }: { children: ReactNode; color?: BadgeColor }) {
  const styles: Record<BadgeColor, CSSProperties> = {
    iris:    { background: 'var(--iris-dim)',     color: 'var(--iris-2)',  border: '1px solid rgba(124,109,248,0.2)' },
    emerald: { background: 'var(--emerald-dim)',  color: 'var(--emerald)', border: '1px solid rgba(0,229,160,0.2)' },
    amber:   { background: 'var(--amber-dim)',    color: 'var(--amber)',   border: '1px solid rgba(245,200,66,0.2)' },
    rose:    { background: 'var(--rose-dim)',      color: 'var(--rose)',    border: '1px solid rgba(240,80,112,0.2)' },
    dim:     { background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)', border: '1px solid var(--line)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.3px',
      ...styles[color],
    }}>
      {children}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
type AvatarColor = 'iris' | 'emerald' | 'amber' | 'rose'
export function Avatar({ initials, color = 'iris', size = 38 }: { initials: string; color?: AvatarColor; size?: number }) {
  const palette: Record<AvatarColor, [string, string]> = {
    iris:    ['rgba(124,109,248,0.18)', 'var(--iris-2)'],
    emerald: ['rgba(0,229,160,0.15)',   'var(--emerald)'],
    amber:   ['rgba(245,200,66,0.15)',  'var(--amber)'],
    rose:    ['rgba(240,80,112,0.15)',  'var(--rose)'],
  }
  const [bg, fg] = palette[color]
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color: fg,
      fontSize: size * 0.37, fontWeight: 600, fontFamily: 'var(--font-mono)',
      letterSpacing: '0.5px',
    }}>{initials}</div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}
export function Btn({ children, variant = 'ghost', size = 'md', style, ...props }: BtnProps) {
  const base: CSSProperties = {
    fontFamily: 'var(--font-display)', fontWeight: 500,
    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: size === 'sm' ? '6px 12px' : '9px 18px',
    fontSize: size === 'sm' ? 12 : 13,
  }
  const variants: Record<string, CSSProperties> = {
    primary: { background: 'var(--iris)', color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-md)' },
    danger:  { background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid rgba(240,80,112,0.25)' },
  }
  return <button {...props} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct > 85 ? 'var(--rose)' : pct > 65 ? 'var(--amber)' : 'var(--emerald)'
  return (
    <div style={{ background: 'var(--raised)', borderRadius: 3, height: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  )
}

// ── Status dot ────────────────────────────────────────────────────────────────
export function StatusDot({ status }: { status: 'active' | 'idle' | 'expired' | 'paused' }) {
  const colors = { active: 'var(--emerald)', idle: 'var(--amber)', expired: 'var(--rose)', paused: 'var(--ink-3)' }
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: colors[status], flexShrink: 0,
      ...(status === 'active' ? { boxShadow: '0 0 6px var(--emerald)' } : {}),
    }} />
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
}

// ── Label + Value pair ────────────────────────────────────────────────────────
export function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)' }}>{value}</div>
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 18px' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          background: 'none', border: 'none', fontFamily: 'var(--font-display)',
          fontSize: 13, fontWeight: 500, padding: '11px 14px', cursor: 'pointer',
          color: active === t.key ? 'var(--ink)' : 'var(--ink-2)',
          borderBottom: `2px solid ${active === t.key ? 'var(--iris)' : 'transparent'}`,
          marginBottom: -1, transition: 'all 0.15s',
        }}>{t.label}</button>
      ))}
    </div>
  )
}

// ── Input with label ──────────────────────────────────────────────────────────
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>{label}</label>
      {children}
    </div>
  )
}

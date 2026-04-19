'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { group: 'Core',    items: [{ href: '/',             label: 'Overview',      icon: '◈' }] },
  { group: 'Agents',  items: [
    { href: '/passports', label: 'Passports',   icon: '⬡' },
    { href: '/create',    label: 'New Agent',   icon: '+' },
  ]},
  { group: 'Finance', items: [
    { href: '/wallet',       label: 'Wallet',       icon: '◎' },
    { href: '/transactions', label: 'Transactions', icon: '↕' },
  ]},
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: 'var(--surface)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
    }}>
      {/* Wordmark */}
      <div style={{ padding: '22px 20px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--iris), var(--emerald))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}>AR</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2 }}>Arno</div>
            <div style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '1.8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Agent OS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '0 8px', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
              {group}
            </div>
            {items.map(({ href, label, icon }) => {
              const active = path === href
              return (
                <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 7,
                    background: active ? 'var(--iris-dim)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(124,109,248,0.2)' : 'transparent'}`,
                    color: active ? 'var(--iris-2)' : 'var(--ink-2)',
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    transition: 'all 0.12s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--raised)' }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{icon}</span>
                    {label}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Network status */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8,
          background: 'var(--emerald-dim)', border: '1px solid rgba(0,229,160,0.15)',
          fontSize: 11, color: 'var(--emerald)', fontFamily: 'var(--font-mono)',
        }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', flexShrink: 0 }} />
          Base · Live
        </div>
      </div>
    </aside>
  )
}

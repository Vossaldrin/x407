'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const META: Record<string, { title: string; crumb: string }> = {
  '/':             { title: 'Overview',      crumb: 'arno / overview' },
  '/passports':    { title: 'Passports',     crumb: 'arno / agents / passports' },
  '/create':       { title: 'New Agent',     crumb: 'arno / agents / create' },
  '/wallet':       { title: 'Wallet',        crumb: 'arno / finance / wallet' },
  '/transactions': { title: 'Transactions',  crumb: 'arno / finance / txns' },
}

const TICKER_ITEMS = [
  'BASE · $ETH 3,370.40 ↑2.4%',
  'ARB · $ARB 0.82 ↓1.1%',
  'ETH · GAS 8 GWEI',
  'BASE · BLOCK 21,445,230',
  'x402 · 38 PAYMENTS TODAY',
  'AGENTS ACTIVE · 7',
  'BLOCKED TXS · 3',
]

export default function Topbar() {
  const path = usePathname()
  const meta = META[path] ?? { title: path, crumb: `arno${path}` }
  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS].join('   ·   ')

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,8,13,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--line)' }}>
      {/* Ticker tape */}
      <div style={{
        height: 28, borderBottom: '1px solid var(--line)',
        background: 'var(--surface)', overflow: 'hidden',
        display: 'flex', alignItems: 'center',
      }}>
        <div className="ticker-inner" style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)',
          letterSpacing: '0.8px', whiteSpace: 'nowrap', gap: 0,
        }}>
          {ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ticker}
        </div>
      </div>

      {/* Main bar */}
      <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginBottom: 3, letterSpacing: '0.5px' }}>
            {meta.crumb}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>{meta.title}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/transactions" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '7px 14px', borderRadius: 7, fontFamily: 'var(--font-display)',
              fontSize: 12, cursor: 'pointer', background: 'transparent',
              color: 'var(--ink-2)', border: '1px solid var(--line-md)', transition: 'all 0.15s',
            }}>
              Activity
            </button>
          </Link>
          <Link href="/create" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '7px 16px', borderRadius: 7, fontFamily: 'var(--font-display)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'var(--iris)', color: '#fff', border: 'none', transition: 'opacity 0.15s',
            }}>
              + New Agent
            </button>
          </Link>
        </div>
      </div>
    </header>
  )
}

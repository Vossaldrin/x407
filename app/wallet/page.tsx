'use client'
import { StoreProvider, useStore } from '@/lib/store'
import { Card, CardHeader, Btn, Stat } from '@/components/ui'

const CHAINS_ALLOC = [
  { name: 'Base',     pct: 48, color: 'var(--iris)' },
  { name: 'Arbitrum', pct: 30, color: 'var(--emerald)' },
  { name: 'Ethereum', pct: 22, color: 'var(--amber)' },
]

function WalletContent() {
  const { tokens, agents } = useStore()
  const totalUsd = tokens.reduce((s, t) => s + t.usdValue, 0)
  const agentTotal = agents.reduce((s, a) => s + a.balance, 0)

  return (
    <div style={{ padding: 24 }} className="animate-fade-up">
      {/* Hero balance */}
      <div style={{
        background: 'linear-gradient(160deg, var(--raised) 0%, var(--card) 100%)',
        border: '1px solid var(--line-md)', borderRadius: 16, padding: 28,
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, var(--iris-dim) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>TOTAL PORTFOLIO VALUE</div>
        <div style={{ fontSize: 46, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-3px', lineHeight: 1, marginBottom: 6 }}>
          ${totalUsd.toLocaleString('en', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 22, fontFamily: 'var(--font-mono)' }}>
          Across {CHAINS_ALLOC.length} chains · {agents.filter(a => a.status === 'active').length} active agents
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="primary" style={{ padding: '10px 24px' }}>Fund Agent Wallet</Btn>
          <Btn style={{ padding: '10px 24px' }}>Withdraw</Btn>
          <Btn style={{ padding: '10px 24px' }}>Send</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Token balances */}
        <Card>
          <CardHeader left={<><span style={{ fontSize: 13, fontWeight: 600 }}>Token Balances</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>{tokens.length} assets</span></>} />
          <div>
            {tokens.map((t, i) => {
              const icons: Record<string, [string, string, string]> = {
                'ETH':  ['Ξ', 'rgba(124,109,248,0.2)',  'var(--iris-2)'],
                'USDC': ['$', 'rgba(56,189,248,0.15)',  'var(--sky)'],
                'USDT': ['₮', 'rgba(0,229,160,0.12)',   'var(--emerald)'],
              }
              const [icon, bg, fg] = icons[t.symbol] ?? ['?', 'var(--raised)', 'var(--ink-2)']
              return (
                <div key={t.symbol} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderBottom: i < tokens.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, flexShrink: 0 }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{t.chains.join(' · ')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{t.amount.toLocaleString()} {t.symbol}</div>
                    <div style={{ fontSize: 11, color: t.change24h >= 0 ? 'var(--emerald)' : 'var(--rose)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                      {t.change24h >= 0 ? '+' : ''}{t.change24h}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Chain allocation */}
        <Card>
          <CardHeader left={<><span style={{ fontSize: 13, fontWeight: 600 }}>Chain Allocation</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>By USD value</span></>} />
          <div style={{ padding: '18px 18px' }}>
            {/* Segmented bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 20, gap: 2 }}>
              {CHAINS_ALLOC.map(c => (
                <div key={c.name} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 2 }} />
              ))}
            </div>
            {CHAINS_ALLOC.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 100, background: 'var(--raised)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', width: 36, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Agent balances */}
      <Card>
        <CardHeader
          left={<><span style={{ fontSize: 13, fontWeight: 600 }}>Agent Balances</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>Funds assigned to each passport</span></>}
          right={<span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>Total: ${agentTotal.toFixed(2)}</span>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {agents.map((a, i) => {
            const accent = { iris:'var(--iris)', emerald:'var(--emerald)', amber:'var(--amber)', rose:'var(--rose)' }[a.color]
            return (
              <div key={a.id} style={{
                padding: '16px 18px',
                borderRight: i < agents.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{a.initials} · {a.chain}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-1px', color: accent }}>${a.balance.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default function WalletPage() {
  return <StoreProvider><WalletContent /></StoreProvider>
}

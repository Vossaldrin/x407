'use client'
import { StoreProvider, useStore } from '@/lib/store'
import { Stat, Card, CardHeader, Badge, Avatar, StatusDot, Progress, Btn } from '@/components/ui'
import Link from 'next/link'

function PassportGlyphCard({ agent }: { agent: ReturnType<typeof useStore>['agents'][0] }) {
  const accentColor = { iris: 'var(--iris)', emerald: 'var(--emerald)', amber: 'var(--amber)', rose: 'var(--rose)' }[agent.color]
  return (
    <div style={{
      background: 'linear-gradient(160deg, var(--raised) 0%, var(--overlay) 100%)',
      border: '1px solid var(--line-md)', borderRadius: 14, padding: 22,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* background glyph */}
      <div style={{
        position: 'absolute', right: -10, top: -10, fontSize: 100, opacity: 0.04,
        fontFamily: 'var(--font-mono)', fontWeight: 700, lineHeight: 1, pointerEvents: 'none',
        color: accentColor,
      }}>⬡</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: accentColor, marginBottom: 5, fontFamily: 'var(--font-mono)' }}>ARNO PASSPORT</div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>{agent.name}</div>
        </div>
        <div style={{ width: 32, height: 24, borderRadius: 4, background: `linear-gradient(135deg, ${accentColor}, var(--amber))`, opacity: 0.7 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Chain', agent.chain], ['Limit/day', `$${agent.dailyLimit}`], ['Address', agent.shortAddr], ['Expires', agent.expiry]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>{k}</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
          <span>DAILY USAGE</span>
          <span>${agent.spentToday} / ${agent.dailyLimit}</span>
        </div>
        <Progress value={agent.spentToday} max={agent.dailyLimit} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {agent.allowedActions.map(a => (
          <span key={a} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>{a}</span>
        ))}
      </div>
    </div>
  )
}

function Overview() {
  const { agents, transactions } = useStore()
  const active  = agents.filter(a => a.status === 'active').length
  const spent   = agents.reduce((s, a) => s + a.spentToday, 0)
  const txCount = transactions.filter(t => t.status === 'confirmed').length
  const blocked = transactions.filter(t => t.status === 'blocked').length
  const recent  = transactions.slice(0, 5)
  const hero    = agents.find(a => a.status === 'active') ?? agents[0]

  return (
    <div style={{ padding: 24 }} className="animate-fade-up">
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }} className="stagger">
        <Stat label="Active Agents"    value={String(active)}       delta="+2 this week" deltaUp accent="var(--iris)" />
        <Stat label="Spent Today"      value={`$${spent}`}          delta="Within limits" deltaUp accent="var(--emerald)" />
        <Stat label="Payments (24h)"   value={String(txCount)}      delta="+12 today" deltaUp accent="var(--amber)" />
        <Stat label="Blocked"          value={String(blocked)}      delta="Over limit" accent="var(--rose)" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Agent roster */}
        <Card>
          <CardHeader
            left={<><span style={{ fontSize: 14, fontWeight: 600 }}>Agent Roster</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>All deployed passports</span></>}
            right={<Badge color="emerald">{active} active</Badge>}
          />
          <div>
            {agents.map((agent, i) => (
              <Link key={agent.id} href="/passports" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                  borderBottom: i < agents.length - 1 ? '1px solid var(--line)' : 'none',
                  transition: 'background 0.1s', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--raised)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar initials={agent.initials} color={agent.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <StatusDot status={agent.status} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{agent.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                      {agent.shortAddr} · {agent.chain} · {agent.txCount} txs
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>${agent.balance.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                    <div style={{ marginTop: 4, minWidth: 80 }}><Progress value={agent.spentToday} max={agent.dailyLimit} /></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
            <Link href="/create" style={{ textDecoration: 'none' }}>
              <Btn variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--iris-2)', borderColor: 'rgba(124,109,248,0.2)' }}>
                + Deploy new agent passport
              </Btn>
            </Link>
          </div>
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Live passport card */}
          <PassportGlyphCard agent={hero} />

          {/* Recent txns */}
          <Card>
            <CardHeader left={<><span style={{ fontSize: 13, fontWeight: 600 }}>Live Feed</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>x402 payments</span></>} />
            <div>
              {recent.map((tx, i) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                    background: tx.status === 'blocked' ? 'var(--rose-dim)' : tx.type === 'out' ? 'rgba(255,255,255,0.05)' : 'var(--emerald-dim)',
                    color: tx.status === 'blocked' ? 'var(--rose)' : tx.type === 'out' ? 'var(--ink-2)' : 'var(--emerald)',
                  }}>
                    {tx.status === 'blocked' ? '⊘' : tx.type === 'out' ? '↑' : '↓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{tx.agentName}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: tx.status === 'blocked' ? 'var(--ink-3)' : tx.type === 'out' ? 'var(--rose)' : 'var(--emerald)' }}>
                      {tx.status === 'blocked' ? '—' : `${tx.type === 'out' ? '-' : '+'}$${tx.amount.toFixed(2)}`}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>{tx.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)' }}>
              <Link href="/transactions" style={{ textDecoration: 'none' }}>
                <Btn variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>View all transactions →</Btn>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return <StoreProvider><Overview /></StoreProvider>
}

'use client'
import { StoreProvider, useStore, Agent } from '@/lib/store'
import { Badge, Progress, Btn, StatusDot, Field } from '@/components/ui'
import Link from 'next/link'

function PassportCard({ agent }: { agent: Agent }) {
  const accent = { iris: 'var(--iris)', emerald: 'var(--emerald)', amber: 'var(--amber)', rose: 'var(--rose)' }[agent.color]
  const statusColor: Record<string, 'emerald'|'amber'|'rose'|'dim'> = {
    active: 'emerald', idle: 'amber', expired: 'rose', paused: 'dim',
  }

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 14, overflow: 'hidden', opacity: agent.status === 'expired' ? 0.55 : 1,
      transition: 'border-color 0.15s, transform 0.15s',
    }}
      onMouseEnter={e => {
        if (agent.status !== 'expired') {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-hi)'
        }
      }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'}
    >
      {/* Top accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot status={agent.status} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px' }}>{agent.name}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginTop: 2 }}>{agent.shortAddr}</div>
            </div>
          </div>
          <Badge color={statusColor[agent.status]}>{agent.status}</Badge>
        </div>

        {/* Fields grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <Field label="Chain"      value={agent.chain} />
          <Field label="Daily Limit" value={`$${agent.dailyLimit.toLocaleString()}`} />
          <Field label="Tx Limit"   value={`$${agent.perTxLimit}`} />
          <Field label="Expires"    value={agent.expiry} />
          <Field label="Balance"    value={`$${agent.balance.toFixed(2)}`} mono />
          <Field label="Txs Total"  value={String(agent.txCount)} mono />
        </div>

        {/* Budget bar */}
        {agent.status !== 'expired' && (
          <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: 'var(--raised)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginBottom: 7 }}>
              <span>DAILY BUDGET</span>
              <span style={{ color: 'var(--ink-2)' }}>${agent.spentToday} / ${agent.dailyLimit}</span>
            </div>
            <Progress value={agent.spentToday} max={agent.dailyLimit} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {agent.allowedActions.map(a => (
            <span key={a} style={{
              padding: '3px 9px', borderRadius: 4, fontSize: 10,
              fontFamily: 'var(--font-mono)', background: 'var(--raised)',
              color: 'var(--ink-2)', border: '1px solid var(--line-md)',
            }}>{a}</span>
          ))}
        </div>

        {/* CTA */}
        {agent.status === 'expired' ? (
          <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>Renew Passport</Btn>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" style={{ flex: 1, justifyContent: 'center' }}>Pause</Btn>
            <Btn size="sm" style={{ flex: 1, justifyContent: 'center' }}>Fund</Btn>
            <Btn size="sm" variant="danger" style={{ flex: 1, justifyContent: 'center' }}>Revoke</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

function PassportsContent() {
  const { agents } = useStore()
  const active  = agents.filter(a => a.status === 'active').length
  const expired = agents.filter(a => a.status === 'expired').length

  return (
    <div style={{ padding: 24 }} className="animate-fade-up">
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Badge color="emerald">{active} active</Badge>
          {expired > 0 && <Badge color="rose">{expired} expired</Badge>}
          <Badge color="dim">{agents.length} total</Badge>
        </div>
        <Link href="/create" style={{ textDecoration: 'none' }}>
          <Btn variant="primary" size="sm">+ New Passport</Btn>
        </Link>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }} className="stagger">
        {agents.map(a => <PassportCard key={a.id} agent={a} />)}
      </div>
    </div>
  )
}

export default function PassportsPage() {
  return <StoreProvider><PassportsContent /></StoreProvider>
}

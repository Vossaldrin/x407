'use client'
import { useStore, Agent, accentColor } from '@/lib/store'
import Link from 'next/link'
import { Wallet, Pause, Trash2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function AgentListCard({ agent }: { agent: Agent }) {
  const accent = accentColor(agent.color)
  const pct = agent.dailyLimit > 0 ? Math.min((agent.spentToday / agent.dailyLimit) * 100, 100) : 0
  const fillClass = pct >= 90 ? 'over' : pct >= 70 ? 'warn' : ''
  const isExpired = agent.status === 'expired'

  const statusBadge: Record<string, string> = {
    active: 'badge-green', idle: 'badge-yellow', expired: 'badge-red', paused: 'badge-gray',
  }

  const revoke = async () => {
    if (!confirm(`Revoke ${agent.name}?`)) return
    await fetch(`${API}/agents/${agent.id}`, { method: 'DELETE' }).catch(() => {})
    window.location.reload()
  }

  return (
    <div className="card card-pad" style={{ opacity: isExpired ? 0.55 : 1, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
        <Link href={`/agents/${agent.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `1px solid ${accent}33` }}>
            {agent.emoji || '🤖'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{agent.name}</span>
              <span className={`badge ${statusBadge[agent.status] ?? 'badge-gray'}`}>{agent.status}</span>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--ink3)', background: 'var(--card2)', padding: '2px 7px', borderRadius: 5 }}>{agent.chain}</span>
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.shortAddr}</div>
          </div>
        </Link>

        {!isExpired && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <Link href="/wallet" className="icon-btn" title="Fund this agent" aria-label="Fund"><Wallet size={13} /></Link>
            <button className="icon-btn" title="Pause" aria-label="Pause"><Pause size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={revoke} title="Revoke" aria-label="Revoke"><Trash2 size={13} /></button>
          </div>
        )}
      </div>

      {!isExpired && (
        <div className="passport-stats-grid">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ color: 'var(--ink3)' }}>Daily spend</span>
              <span className="mono" style={{ color: 'var(--ink2)' }}>${agent.spentToday} <span style={{ color: 'var(--ink3)' }}>/ ${agent.dailyLimit}</span></span>
            </div>
            <div className="prog-bg">
              <div className={`prog-fill ${fillClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ color: 'var(--ink3)' }}>Balance</span>
              <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>${agent.balance.toFixed(2)}</span>
            </div>
            <div className="prog-bg" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, color: 'var(--ink3)' }}>Allowed:</span>
        {agent.allowedActions.map(a => (
          <span key={a} className="action-tag" style={{ cursor: 'default' }}>{a}</span>
        ))}
        <span style={{ fontSize: 10.5, color: 'var(--ink3)', marginLeft: 2 }}>· Hired {agent.createdAt}</span>
      </div>

      {isExpired && (
        <Link href="/create" className="btn-primary-lg" style={{ width: '100%', marginTop: 16 }}>Renew passport</Link>
      )}
    </div>
  )
}

export default function PassportsPage() {
  const { agents } = useStore()
  const active  = agents.filter(a => a.status === 'active').length
  const expired = agents.filter(a => a.status === 'expired').length

  return (
    <div className="animate-up gap-pad">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>My Agents</h1>
          <p style={{ fontSize: 14, color: 'var(--ink3)' }}>{active} active · {agents.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {expired > 0 && <span className="badge badge-red">{expired} expired</span>}
        </div>
      </div>

      {agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🦅</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>No agents yet</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20 }}>Hire one from the marketplace or create a custom agent</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/marketplace" className="btn-ghost-lg">Browse marketplace</Link>
            <Link href="/create" className="btn-primary-lg">+ Create custom</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="stagger">
          {agents.map(a => <AgentListCard key={a.id} agent={a} />)}
        </div>
      )}
    </div>
  )
}

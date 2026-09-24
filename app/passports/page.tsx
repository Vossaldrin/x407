'use client'
import dynamic from 'next/dynamic'
import { useStore, Agent, accentColor } from '@/lib/store'
import Link from 'next/link'
import { Wallet, Pause, Trash2, Plus } from 'lucide-react'
import { StaticFallback } from '@/components/agents/OrbFallback'

const OrbIcon = dynamic(() => import('@/components/agents/OrbIcon'), {
  ssr: false,
  loading: () => <StaticFallback color="var(--ink3)" />,
})

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function AgentTile({ agent }: { agent: Agent }) {
  const accent = accentColor(agent.color)
  const pct = agent.dailyLimit > 0 ? Math.min((agent.spentToday / agent.dailyLimit) * 100, 100) : 0
  const fillClass = pct >= 90 ? 'over' : pct >= 70 ? 'warn' : ''
  const isExpired = agent.status === 'expired'
  const visibleActions = agent.allowedActions.slice(0, 3)
  const extraActions = agent.allowedActions.length - visibleActions.length

  const statusBadge: Record<string, string> = {
    active: 'badge-green', idle: 'badge-yellow', expired: 'badge-red', paused: 'badge-gray',
  }

  const revoke = async () => {
    if (!confirm(`Revoke ${agent.name}?`)) return
    await fetch(`${API}/agents/${agent.id}`, { method: 'DELETE' }).catch(() => {})
    window.location.reload()
  }

  return (
    <div className={`agent-tile ${isExpired ? 'agent-tile-expired' : ''}`}>
      <div className="agent-tile-top">
        <div className="agent-tile-icon" style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}14)` }}>
          <OrbIcon color={accent} />
        </div>
        <span className={`badge ${statusBadge[agent.status] ?? 'badge-gray'}`}>{agent.status}</span>
      </div>

      <Link href={`/agents/${agent.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="agent-tile-name">{agent.name}</span>
          <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--ink3)', background: 'var(--card2)', padding: '2px 7px', borderRadius: 5 }}>{agent.chain}</span>
        </div>
        <div className="mono agent-tile-addr">{agent.shortAddr}</div>
      </Link>

      {!isExpired && (
        <div className="passport-stats-grid" style={{ gap: 16, margin: '16px 0' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ color: 'var(--ink3)' }}>Daily spend</span>
              <span className="mono" style={{ color: 'var(--ink2)' }}>${agent.spentToday}<span style={{ color: 'var(--ink3)' }}>/${agent.dailyLimit}</span></span>
            </div>
            <div className="prog-bg"><div className={`prog-fill ${fillClass}`} style={{ width: `${pct}%` }} /></div>
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

      <div className="agent-tile-actions">
        {visibleActions.map(a => <span key={a} className="action-tag" style={{ cursor: 'default' }}>{a}</span>)}
        {extraActions > 0 && <span className="action-tag" style={{ cursor: 'default' }}>+{extraActions}</span>}
      </div>

      <div className="agent-tile-footer">
        <span style={{ fontSize: 10, color: 'var(--ink3)' }}>Hired {agent.createdAt}</span>
        {isExpired ? (
          <Link href="/create" className="view-details">Renew →</Link>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href="/wallet" className="icon-btn" title="Fund this agent" aria-label="Fund"><Wallet size={12} /></Link>
            <button className="icon-btn" title="Pause" aria-label="Pause"><Pause size={12} /></button>
            <button className="icon-btn icon-btn-danger" onClick={revoke} title="Revoke" aria-label="Revoke"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateAgentTile() {
  return (
    <Link href="/create" style={{ textDecoration: 'none' }}>
      <div className="agent-tile agent-tile-create">
        <Plus size={26} color="var(--ink3)" />
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginTop: 10 }}>Create new agent</div>
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>Custom rules, any network</div>
      </div>
    </Link>
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
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20 }}>Hire one from BotMart or create a custom agent</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/marketplace" className="btn-ghost-lg">Browse BotMart</Link>
            <Link href="/create" className="btn-primary-lg">+ Create custom</Link>
          </div>
        </div>
      ) : (
        <div className="mkt-grid stagger">
          {agents.map(a => <AgentTile key={a.id} agent={a} />)}
          <CreateAgentTile />
        </div>
      )}
    </div>
  )
}

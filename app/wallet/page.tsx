'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { sendFunds, hasMetaMask } from '@/lib/wallet-connect'
import Link from 'next/link'
import { X } from 'lucide-react'

const QUICK_AMOUNTS = ['0.01', '0.05', '0.1', '0.5']

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CHAINS_ALLOC = [
  { name: 'Base',     pct: 48, color: 'var(--green)' },
  { name: 'Arbitrum', pct: 30, color: 'var(--yellow)' },
  { name: 'Ethereum', pct: 22, color: '#7C6DF8' },
]

const TOKEN_ICONS: Record<string, [string, string, string]> = {
  ETH:  ['Ξ', 'rgba(124,109,248,0.15)', '#7C6DF8'],
  USDC: ['$', 'rgba(76,175,80,0.12)',   'var(--green)'],
  USDT: ['₮', 'rgba(255,214,0,0.12)',   '#9A7800'],
}

function FundModal({ agents, onClose }: { agents: any[]; onClose: () => void }) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? '')
  const [amount, setAmount]   = useState('0.01')
  const [status, setStatus]   = useState<'idle'|'sending'|'done'|'error'>('idle')
  const [msg, setMsg]         = useState('')

  const agent = agents.find(a => a.id === agentId)

  const send = async () => {
    if (!agent) return
    if (!hasMetaMask()) {
      setStatus('error')
      setMsg('MetaMask not detected. Install it from metamask.io to fund agent wallets.')
      return
    }
    setStatus('sending')
    const result = await sendFunds(agent.fullAddr, amount, agent.chain)
    if (result.ok) {
      setStatus('done')
      setMsg(`Sent! Tx hash: ${result.hash}`)
    } else {
      setStatus('error')
      setMsg(result.error || 'Transaction failed')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 400, width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Fund agent wallet</div>
          <button className="icon-btn" onClick={onClose} title="Close" aria-label="Close"><X size={14} /></button>
        </div>

        <div className="field-label">Agent</div>
        <select className="field-input" style={{ marginBottom: 14 }} value={agentId} onChange={e => setAgentId(e.target.value)}>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name} · {a.shortAddr}</option>)}
        </select>

        <div className="field-label">Amount (ETH)</div>
        <input className="field-input" style={{ marginBottom: 10 }} type="number" step="0.001" value={amount} onChange={e => setAmount(e.target.value)} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {QUICK_AMOUNTS.map(v => (
            <button key={v} onClick={() => setAmount(v)}
              className={`chip ${amount === v ? 'on' : ''}`} style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)' }}>
              {v}
            </button>
          ))}
        </div>

        {msg && (
          <div style={{ fontSize: 11.5, color: status === 'error' ? 'var(--rose)' : 'var(--green)', marginBottom: 14, lineHeight: 1.5, wordBreak: 'break-all' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={send} disabled={status === 'sending'}>
            {status === 'sending' ? 'Confirm in MetaMask…' : 'Send funds →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WalletPage() {
  const { tokens, agents, transactions } = useStore()
  const [showFund, setShowFund] = useState(false)
  const [summaryInsight, setSummaryInsight] = useState<string | null>(null)
  const totalUsd   = tokens.reduce((s, t) => s + t.usdValue, 0)
  const agentTotal = agents.reduce((s, a) => s + a.balance, 0)
  const active     = agents.filter(a => a.status === 'active').length

  useEffect(() => {
    fetch(`${API}/wallet/summary-insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, totalUsd }),
    }).then(r => r.json()).then(d => setSummaryInsight(d.insight || null)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="animate-up gap-pad">
      {showFund && <FundModal agents={agents} onClose={() => setShowFund(false)} />}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>Wallet</h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)' }}>All balances and agent allocations.</p>
      </div>

      {/* Hero */}
      <div className="wallet-hero">
        <div className="wallet-glow" />
        <div className="stat-label">Total portfolio value</div>
        <div style={{ fontSize: 44, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '-3px', lineHeight: 1, marginBottom: 6, color: 'var(--ink)' }}>
          ${totalUsd.toLocaleString('en', { minimumFractionDigits: 2 })}
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 22 }}>
          Across {CHAINS_ALLOC.length} chains · {active} active agents
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary-lg" onClick={() => setShowFund(true)}>Fund agent wallet</button>
          <button className="btn-ghost-lg" onClick={() => alert("Withdraw is coming soon")}>Withdraw</button>
          <button className="btn-ghost-lg" onClick={() => alert("Send is coming soon")}>Send</button>
        </div>
      </div>

      {summaryInsight && (
        <div className="card card-pad" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🧭</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>AI spending summary</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5 }}>{summaryInsight}</div>
          </div>
        </div>
      )}

      <div className="wallet-two-col">
        {/* Token balances */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '0.5px solid var(--line)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Token balances</span>
            <span style={{ fontSize: 11, color: 'var(--ink2)' }}>{tokens.length} assets</span>
          </div>
          {tokens.map((t, i) => {
            const [icon, bg, fg] = TOKEN_ICONS[t.symbol] ?? ['?', 'var(--card2)', 'var(--ink2)']
            return (
              <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < tokens.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{t.chains.join(' · ')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{t.amount.toLocaleString()} {t.symbol}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: t.change24h >= 0 ? 'var(--green)' : 'var(--rose)', marginTop: 2 }}>
                    {t.change24h >= 0 ? '+' : ''}{t.change24h}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chain allocation */}
        <div className="card">
          <div style={{ padding: '13px 18px', borderBottom: '0.5px solid var(--line)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Chain allocation</span>
          </div>
          <div style={{ padding: '18px' }}>
            <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 20, gap: 2 }}>
              {CHAINS_ALLOC.map(c => <div key={c.name} style={{ width: `${c.pct}%`, background: c.color }} />)}
            </div>
            {CHAINS_ALLOC.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} />
                  <span style={{ fontSize: 13, color: 'var(--ink)' }}>{c.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 90, background: 'var(--card2)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: c.color }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink2)', width: 32, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent balances */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '0.5px solid var(--line)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Agent balances</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink2)' }}>Total: ${agentTotal.toFixed(2)}</span>
        </div>
        <div className="wallet-agent-row" style={{ gridTemplateColumns: `repeat(${Math.min(agents.length, 4) || 1}, 1fr)` }}>
          {agents.map((a, i) => {
            const accent = { emerald: 'var(--green)', amber: 'var(--yellow)', iris: '#7C6DF8', rose: 'var(--rose)' }[a.color] ?? 'var(--green)'
            return (
              <div key={a.id} style={{ padding: '16px 18px', borderRight: i < agents.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{a.initials} · {a.chain}</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-1px', color: accent }}>${a.balance.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
              </div>
            )
          })}
          {agents.length === 0 && (
            <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>
              <Link href="/marketplace" style={{ color: 'var(--green)' }}>Hire an agent</Link> to see balances here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

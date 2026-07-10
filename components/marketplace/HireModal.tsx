'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, MarketplaceTemplate } from '@/lib/store'
import { ACTION_DESCRIPTIONS } from '@/lib/action-descriptions'
import { X } from 'lucide-react'

const ALL_ACTIONS = Object.keys(ACTION_DESCRIPTIONS)

export function HireModal({ tpl, onClose }: { tpl: MarketplaceTemplate; onClose: () => void }) {
  const { hireAgent } = useStore()
  const router = useRouter()
  const [chain, setChain] = useState('Base')
  const [expiry, setExpiry] = useState('2026-12-31')
  const [dailyLimit, setDailyLimit] = useState(String(tpl.defaultDailyLimit))
  const [perTxLimit, setPerTxLimit] = useState(String(tpl.defaultPerTxLimit))
  const [actions, setActions] = useState<string[]>(tpl.defaultActions)
  const [hiring, setHiring] = useState(false)
  const [pk, setPk] = useState<string | null>(null)

  const toggleAction = (a: string) =>
    setActions(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])

  const hire = async () => {
    setHiring(true)
    const result = await hireAgent(tpl.id, chain, expiry, {
      dailyLimit: parseFloat(dailyLimit) || tpl.defaultDailyLimit,
      perTxLimit: parseFloat(perTxLimit) || tpl.defaultPerTxLimit,
      actions,
    })
    setHiring(false)
    if (result) setPk(result.privateKey)
  }

  if (pk) return (
    <div className="modal-overlay">
      <div className="modal-panel" style={{ maxWidth: 440, width: '90%' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>✓ {tpl.name} deployed</div>
        <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 16, lineHeight: 1.5 }}>
          Your agent has a real Ethereum wallet. Save this private key — it will never be shown again.
        </div>
        <div style={{ background: 'var(--card2)', border: '0.5px solid var(--rose)', borderRadius: 9, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Private key — save now</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.6 }}>{pk}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost-lg" style={{ flex: 1 }} onClick={() => { navigator.clipboard.writeText(pk) }}>Copy key</button>
          <button className="btn-primary-lg" style={{ flex: 2 }} onClick={() => { onClose(); router.push('/passports') }}>View my agents →</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 400, width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{tpl.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{tpl.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Hire agent</div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" aria-label="Close"><X size={14} /></button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div className="field-label">Network</div>
          <div className="chip-group">
            {['Base','Ethereum','Arbitrum'].map(c => (
              <button key={c} className={`chip ${chain === c ? 'on' : ''}`} onClick={() => setChain(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div className="field-label">Passport expiry</div>
          <input type="date" className="field-input" value={expiry} onChange={e => setExpiry(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div className="field-label">Daily limit ($)</div>
            <input className="field-input" type="number" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} />
          </div>
          <div>
            <div className="field-label">Per-tx cap ($)</div>
            <input className="field-input" type="number" value={perTxLimit} onChange={e => setPerTxLimit(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="field-label" style={{ marginBottom: 6 }}>Allowed actions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_ACTIONS.map(a => (
              <button key={a} className={`action-tag ${actions.includes(a) ? 'on' : ''}`} onClick={() => toggleAction(a)} type="button">
                {a}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost-lg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary-lg" style={{ flex: 2 }} onClick={hire} disabled={hiring}>
            {hiring ? 'Deploying…' : `Hire ${tpl.name} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

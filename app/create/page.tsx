'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, accentColor } from '@/lib/store'

const CHAINS  = ['Base','Ethereum','Arbitrum','Optimism','Polygon'] as const
const COLORS  = ['emerald','amber','iris','rose'] as const
const ACTIONS = ['pay_api','fetch_data','buy_compute','trade','swap','shop','book_travel','deploy','scan']

type F = {
  name: string; chain: string; dailyLimit: string; perTxLimit: string
  expiry: string; actions: string[]; ownerWallet: string; color: string
}
const INIT: F = { name:'', chain:'Base', dailyLimit:'500', perTxLimit:'50', expiry:'2026-12-31', actions:['pay_api','fetch_data'], ownerWallet:'', color:'emerald' }

export default function CreatePage() {
  const { createAgent } = useStore()
  const router = useRouter()
  const [form, setForm]       = useState<F>(INIT)
  const [deploying, setDepl]  = useState(false)
  const [pk, setPk]           = useState<string | null>(null)
  const [agentName, setAName] = useState('')

  const set = (k: keyof F, v: string | string[]) => setForm(p => ({ ...p, [k]: v }))
  const toggleAction = (a: string) =>
    set('actions', form.actions.includes(a) ? form.actions.filter(x => x !== a) : [...form.actions, a])

  const deploy = async () => {
    if (!form.name.trim()) return
    setDepl(true)
    const result = await createAgent({
      name: form.name.trim(),
      chain: form.chain,
      dailyLimit: parseFloat(form.dailyLimit) || 500,
      perTxLimit: parseFloat(form.perTxLimit) || 50,
      expiry: form.expiry || '2026-12-31',
      actions: form.actions,
      ownerWallet: form.ownerWallet || null,
      color: form.color,
    })
    setDepl(false)
    if (result) {
      setPk(result.privateKey)
      setAName(form.name.trim())
    } else {
      alert('Backend offline — make sure uvicorn is running on port 8000')
    }
  }

  const accent = accentColor(form.color)

  if (pk) return (
    <div className="animate-up gap-pad" style={{ maxWidth: 500 }}>
      <div style={{ background: 'var(--green-dim)', border: '0.5px solid var(--green)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>✓</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{agentName} deployed</div>
          <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>Real Ethereum wallet created</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, var(--rose), transparent)` }} />
        <div className="card-pad">
          <div style={{ fontSize: 10, color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>⚠ Private key — save now, shown once</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.7, background: 'var(--card2)', borderRadius: 8, padding: 12 }}>{pk}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-ghost-lg" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(pk)}>Copy key</button>
        <button className="btn-primary-lg" style={{ flex: 2 }} onClick={() => router.push('/passports')}>View my agents →</button>
      </div>
    </div>
  )

  return (
    <div className="animate-up gap-pad">
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>Create Agent</h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Configure and deploy a new autonomous agent.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Form */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="field-label">Agent name</div>
            <input className="field-input" type="text" placeholder="e.g. Research Bot Alpha"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <div className="field-label">Network</div>
            <div className="chip-group">
              {CHAINS.map(c => <button key={c} className={`chip ${form.chain === c ? 'on' : ''}`} onClick={() => set('chain', c)}>{c}</button>)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="field-label">Daily limit ($)</div>
              <input className="field-input" type="number" placeholder="500" value={form.dailyLimit} onChange={e => set('dailyLimit', e.target.value)} />
            </div>
            <div>
              <div className="field-label">Per-tx max ($)</div>
              <input className="field-input" type="number" placeholder="50" value={form.perTxLimit} onChange={e => set('perTxLimit', e.target.value)} />
            </div>
          </div>

          <div>
            <div className="field-label">Expiry date</div>
            <input className="field-input" type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
          </div>

          <div>
            <div className="field-label">Allowed actions</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
              {ACTIONS.map(a => (
                <button key={a} className={`action-tag ${form.actions.includes(a) ? 'on' : ''}`} onClick={() => toggleAction(a)}>{a}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="field-label">Color</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: accentColor(c), border: `2px solid ${form.color === c ? accentColor(c) : 'transparent'}`,
                  outline: form.color === c ? `3px solid var(--card2)` : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                }} />
              ))}
            </div>
          </div>

          <div>
            <div className="field-label">Owner wallet (optional)</div>
            <input className="field-input" type="text" placeholder="0x..." value={form.ownerWallet} onChange={e => set('ownerWallet', e.target.value)} />
          </div>

          <button className="btn-primary-lg" style={{ width: '100%', opacity: deploying || !form.name ? 0.6 : 1 }}
            onClick={deploy} disabled={deploying || !form.name.trim()}>
            {deploying ? 'Deploying passport…' : 'Deploy passport →'}
          </button>
        </div>

        {/* Live preview */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div className="field-label" style={{ marginBottom: 10 }}>Live preview</div>
          <div className="passport-card">
            <div className="passport-stripe" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
            <div className="passport-label">Arnold Passport</div>
            <div className="passport-name" style={{ color: form.name ? 'var(--ink)' : 'var(--ink3)' }}>
              {form.name || 'Agent name…'}
            </div>
            <div className="passport-grid">
              {[
                ['Network',    form.chain || '—'],
                ['Daily limit', form.dailyLimit ? `$${form.dailyLimit}` : '—'],
                ['Address',    '0x????…????'],
                ['Per-tx cap', form.perTxLimit ? `$${form.perTxLimit}` : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="passport-field-label">{k}</div>
                  <div className="passport-field-value">{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {form.actions.length === 0
                ? <span style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>no actions selected</span>
                : form.actions.map(a => <span key={a} className="action-tag" style={{ cursor: 'default' }}>{a}</span>)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoreProvider, useStore, Agent, genAddress, shortAddr } from '@/lib/store'
import { Card, CardHeader, Btn, Badge, Progress, FormField } from '@/components/ui'

const CHAINS = ['Base','Ethereum','Arbitrum','Optimism','Polygon'] as const
const COLORS  = ['iris','emerald','amber','rose'] as const
const ACTIONS = ['pay_api','fetch_data','buy_compute','trade','swap','broker_data','scan']

type F = {
  name: string; chain: string; dailyLimit: string; perTxLimit: string
  expiry: string; actions: string[]; ownerWallet: string; color: string
}

const INIT: F = { name:'', chain:'Base', dailyLimit:'500', perTxLimit:'50', expiry:'', actions:['pay_api','fetch_data'], ownerWallet:'', color:'iris' }

function LivePreview({ form }: { form: F }) {
  const accent = { iris:'var(--iris)', emerald:'var(--emerald)', amber:'var(--amber)', rose:'var(--rose)' }[form.color] ?? 'var(--iris)'
  return (
    <div style={{ position: 'sticky', top: 80 }}>
      <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>LIVE PREVIEW</div>
      <div style={{
        background: 'linear-gradient(160deg, var(--raised) 0%, var(--overlay) 100%)',
        border: `1px solid ${accent}33`, borderRadius: 14, padding: 22,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 0 40px ${accent}15`,
      }}>
        <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 90, opacity: 0.05, fontFamily: 'var(--font-mono)', color: accent, lineHeight: 1 }}>⬡</div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, margin: '-22px -22px 18px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: accent, marginBottom: 5, fontFamily: 'var(--font-mono)' }}>ARNO PASSPORT</div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', color: form.name ? 'var(--ink)' : 'var(--ink-3)' }}>
              {form.name || 'Agent Name…'}
            </div>
          </div>
          <div style={{ width: 30, height: 22, borderRadius: 4, background: `linear-gradient(135deg, ${accent}, var(--amber))`, opacity: 0.7 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            ['Chain',    form.chain || '—'],
            ['Limit/day', form.dailyLimit ? `$${form.dailyLimit}` : '—'],
            ['Address',  '0x????…????'],
            ['Expires',  form.expiry || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>{k}</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginBottom: 6 }}>
            <span>BUDGET</span><span>$0 / ${form.dailyLimit || '?'}</span>
          </div>
          <Progress value={0} max={parseFloat(form.dailyLimit) || 100} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {form.actions.length === 0
            ? <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>no actions selected</span>
            : form.actions.map(a => (
                <span key={a} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>{a}</span>
              ))
          }
        </div>
      </div>
    </div>
  )
}

function SuccessView({ agent }: { agent: Agent }) {
  const router = useRouter()
  const accent = { iris:'var(--iris)', emerald:'var(--emerald)', amber:'var(--amber)', rose:'var(--rose)' }[agent.color]
  return (
    <div style={{ padding: 24, maxWidth: 640 }} className="animate-fade-up">
      <div style={{ padding: '16px 20px', background: 'var(--emerald-dim)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)', fontSize: 16, flexShrink: 0 }}>✓</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--emerald)' }}>Passport deployed on {agent.chain}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{agent.fullAddr}</div>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(160deg, var(--raised), var(--overlay))',
        border: `1px solid ${accent}33`, borderRadius: 14, padding: 24, marginBottom: 20,
        boxShadow: `0 0 40px ${accent}10`,
      }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, margin: '-24px -24px 20px' }} />
        <div style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: accent, marginBottom: 5, fontFamily: 'var(--font-mono)' }}>ARNO PASSPORT · ISSUED</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>{agent.name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[['Chain', agent.chain], ['Daily Limit', `$${agent.dailyLimit}`], ['Address', agent.shortAddr], ['Expires', agent.expiry]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>{k}</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {agent.allowedActions.map(a => (
            <span key={a} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.06)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>{a}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={() => router.push('/create')} style={{ flex: 1, justifyContent: 'center' }}>Deploy Another</Btn>
        <Btn variant="primary" onClick={() => router.push('/passports')} style={{ flex: 2, justifyContent: 'center' }}>View All Passports →</Btn>
      </div>
    </div>
  )
}

function CreateContent() {
  const { addAgent } = useStore()
  const [form, setForm]       = useState<F>(INIT)
  const [deploying, setDepl]  = useState(false)
  const [done, setDone]       = useState<Agent | null>(null)

  const set = (k: keyof F, v: string | string[]) => setForm(p => ({ ...p, [k]: v }))
  const toggleAction = (a: string) =>
    set('actions', form.actions.includes(a) ? form.actions.filter(x => x !== a) : [...form.actions, a])

  const deploy = async () => {
    if (!form.name || !form.dailyLimit) return
    setDepl(true)
    await new Promise(r => setTimeout(r, 1600))
    const full = genAddress()
    const agent: Agent = {
      id: `ag_${Date.now()}`,
      name: form.name,
      shortAddr: shortAddr(full),
      fullAddr: full,
      chain: form.chain as Agent['chain'],
      dailyLimit: parseFloat(form.dailyLimit) || 500,
      perTxLimit: parseFloat(form.perTxLimit) || 50,
      spentToday: 0,
      balance: 0,
      status: 'active',
      allowedActions: form.actions,
      expiry: form.expiry || '2025-12-31',
      ownerWallet: form.ownerWallet,
      initials: form.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(),
      color: form.color as Agent['color'],
      createdAt: new Date().toISOString().slice(0,10),
      txCount: 0,
    }
    addAgent(agent)
    setDone(agent)
    setDepl(false)
  }

  if (done) return <SuccessView agent={done} />

  return (
    <div style={{ padding: 24 }} className="animate-fade-up">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <Card>
          <CardHeader left={<><span style={{ fontSize: 14, fontWeight: 600 }}>Configure Passport</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>Issue a new agent identity + wallet</span></>} />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            <FormField label="Agent Name">
              <input type="text" placeholder="e.g. ResearchBot Alpha" value={form.name} onChange={e => set('name', e.target.value)} />
            </FormField>

            <FormField label="Chain">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CHAINS.map(c => (
                  <button key={c} onClick={() => set('chain', c)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.12s',
                    border: `1px solid ${form.chain === c ? 'rgba(124,109,248,0.4)' : 'var(--line-md)'}`,
                    background: form.chain === c ? 'var(--iris-dim)' : 'transparent',
                    color: form.chain === c ? 'var(--iris-2)' : 'var(--ink-2)',
                  }}>{c}</button>
                ))}
              </div>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Daily Limit ($)">
                <input type="number" placeholder="500" value={form.dailyLimit} onChange={e => set('dailyLimit', e.target.value)} />
              </FormField>
              <FormField label="Per-Tx Max ($)">
                <input type="number" placeholder="50" value={form.perTxLimit} onChange={e => set('perTxLimit', e.target.value)} />
              </FormField>
            </div>

            <FormField label="Expiry Date">
              <input type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
            </FormField>

            <FormField label="Allowed Actions">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                {ACTIONS.map(a => {
                  const on = form.actions.includes(a)
                  return (
                    <button key={a} onClick={() => toggleAction(a)} style={{
                      padding: '5px 12px', borderRadius: 5, fontSize: 11,
                      fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.12s',
                      border: `1px solid ${on ? 'rgba(124,109,248,0.35)' : 'var(--line)'}`,
                      background: on ? 'var(--iris-dim)' : 'var(--raised)',
                      color: on ? 'var(--iris-2)' : 'var(--ink-3)',
                    }}>{a}</button>
                  )
                })}
              </div>
            </FormField>

            <FormField label="Passport Color">
              <div style={{ display: 'flex', gap: 10 }}>
                {COLORS.map(c => {
                  const col = { iris:'var(--iris)', emerald:'var(--emerald)', amber:'var(--amber)', rose:'var(--rose)' }[c]
                  return (
                    <button key={c} onClick={() => set('color', c)} style={{
                      width: 28, height: 28, borderRadius: '50%', border: `2px solid ${form.color === c ? col : 'transparent'}`,
                      background: col, cursor: 'pointer', transition: 'all 0.15s', outline: 'none',
                      boxShadow: form.color === c ? `0 0 12px ${col}60` : 'none',
                    }} />
                  )
                })}
              </div>
            </FormField>

            <FormField label="Owner Wallet (optional)">
              <input type="text" placeholder="0x..." value={form.ownerWallet} onChange={e => set('ownerWallet', e.target.value)} />
            </FormField>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <Btn onClick={deploy} variant="primary" disabled={deploying || !form.name} style={{ flex: 1, justifyContent: 'center', opacity: deploying || !form.name ? 0.6 : 1 }}>
                {deploying ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                    Deploying passport…
                  </span>
                ) : 'Deploy Passport →'}
              </Btn>
            </div>
          </div>
        </Card>

        {/* Live preview */}
        <LivePreview form={form} />
      </div>
    </div>
  )
}

export default function CreatePage() {
  return <StoreProvider><CreateContent /></StoreProvider>
}

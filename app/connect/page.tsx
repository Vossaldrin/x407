'use client'
// "Connect your agent" — the in-app path for people who don't want to copy the
// landing-page code: bring an existing bot (Grok, GPT, a cron script…), get it a
// wallet + spend rules here, and leave with the credentials + the exact
// integration steps. Under the hood it's the same client-side wallet generation
// and POST /agents as Create Agent — the difference is the framing and the
// handoff screen, which is written for wiring up an external agent.
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Check, Copy } from 'lucide-react'

const PROVIDERS = ['Grok', 'Claude', 'GPT', 'Gemini', 'DeepSeek', 'Mistral', 'Other'] as const
// Same enforced vocabulary as Create Agent — these gate real payments server-side.
const ACTIONS = ['pay_api', 'fetch_data', 'trade', 'swap', 'trigger_patch']

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function CopyField({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard.writeText(value).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }).catch(() => {})
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="field-label" style={danger ? { color: 'var(--rose)' } : undefined}>{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div className="mono" style={{
          flex: 1, fontSize: 11, color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.6,
          background: 'var(--card2)', borderRadius: 8, padding: '10px 12px',
          border: danger ? '0.5px solid var(--rose)' : '0.5px solid var(--line2)',
        }}>{value}</div>
        <button className="btn-ghost-lg" style={{ padding: '0 14px' }} onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

export default function ConnectPage() {
  const { createAgent } = useStore()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<string>('Grok')
  const [dailyLimit, setDailyLimit] = useState('25')
  const [perTxLimit, setPerTxLimit] = useState('5')
  const [actions, setActions] = useState<string[]>(['pay_api', 'fetch_data'])
  const [connecting, setConnecting] = useState(false)
  const [result, setResult] = useState<{ id: string; address: string; privateKey: string; name: string } | null>(null)

  const toggleAction = (a: string) =>
    setActions(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])

  const connect = async () => {
    if (!name.trim()) return
    setConnecting(true)
    const res = await createAgent({
      name: name.trim(),
      chain: 'Base',
      dailyLimit: parseFloat(dailyLimit) || 25,
      perTxLimit: parseFloat(perTxLimit) || 5,
      expiry: '2026-12-31',
      actions,
      color: 'emerald',
      customRules: `External agent connected from ${provider}.`,
    })
    setConnecting(false)
    if (res) {
      setResult({ id: res.agent.id, address: (res.agent as any).fullAddr, privateKey: res.privateKey, name: name.trim() })
    } else {
      alert('Backend offline — make sure uvicorn is running on port 8000')
    }
  }

  if (result) {
    const wireUp = `# x407 credentials for ${result.name} (${provider})
X407_API=${API}
X407_AGENT_ID=${result.id}
X407_WALLET_ADDRESS=${result.address}
X407_PRIVATE_KEY=${result.privateKey}   # keep in your bot's env, never in code

# To pay for a resource from your bot:
# 1. GET the resource URL — it answers HTTP 402 with {"accepts":[{amount, asset, payTo}]}
# 2. Send exactly that USDC amount on Base from $X407_WALLET_ADDRESS
# 3. Retry the request with header "X-PAYMENT-TX: <tx hash>" to unlock
# Every payment is checked against this agent's limits + allowed actions first.`
    return (
      <div className="animate-up gap-pad" style={{ maxWidth: 560 }}>
        <div style={{ background: 'var(--green-dim)', border: '0.5px solid var(--green)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>✓</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{result.name} connected</div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>Real wallet on Base — fund it with USDC and your {provider} agent can start paying</div>
          </div>
        </div>

        <CopyField label="⚠ Private key — save now, shown once" value={result.privateKey} danger />
        <CopyField label="Wallet address (fund this with USDC on Base)" value={result.address} />
        <CopyField label="Agent ID" value={result.id} />

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-pad">
            <div className="field-label">Wire-up for your bot — env + payment steps</div>
            <pre className="mono" style={{ fontSize: 10.5, lineHeight: 1.7, color: 'var(--ink2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--card2)', borderRadius: 8, padding: 12, margin: 0 }}>{wireUp}</pre>
            <button className="btn-primary-lg" style={{ width: '100%', marginTop: 12 }} onClick={() => navigator.clipboard.writeText(wireUp).catch(() => {})}>
              Copy wire-up
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-up gap-pad" style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>Connect your agent</h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.6 }}>
          Already running a bot — Grok, GPT, a cron script? Give it a wallet and spend rules here,
          then drop the credentials into its environment. No code changes on our side required:
          it pays over plain HTTP 402.
        </p>
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="field-label">Agent name</div>
          <input className="field-input" type="text" placeholder="e.g. my Grok trading bot"
            value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <div className="field-label">Built with</div>
          <div className="chip-group">
            {PROVIDERS.map(p => <button key={p} className={`chip ${provider === p ? 'on' : ''}`} onClick={() => setProvider(p)}>{p}</button>)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="field-label">Daily limit ($)</div>
            <input className="field-input" type="number" placeholder="25" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} />
          </div>
          <div>
            <div className="field-label">Per-tx max ($)</div>
            <input className="field-input" type="number" placeholder="5" value={perTxLimit} onChange={e => setPerTxLimit(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="field-label">Allowed actions</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
            {ACTIONS.map(a => (
              <button key={a} className={`action-tag ${actions.includes(a) ? 'on' : ''}`} onClick={() => toggleAction(a)}>{a}</button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 8, lineHeight: 1.5 }}>
            Enforced server-side on every payment — an action outside this list is rejected before it settles.
          </div>
        </div>

        <button className="btn-primary-lg" style={{ width: '100%', opacity: connecting || !name.trim() ? 0.6 : 1 }}
          onClick={connect} disabled={connecting || !name.trim()}>
          {connecting ? 'Connecting…' : 'Connect agent →'}
        </button>
      </div>
    </div>
  )
}

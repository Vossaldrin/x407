'use client'
import { useEffect, useState } from 'react'
import { Agent, useStore } from '@/lib/store'
import { payWithAgentWallet, agentAddressFromKey } from '@/lib/x407-agent-pay'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DemoSource {
  id: string
  name: string
  price: number
  description: string
}

type Step = 'form' | 'sign' | 'paying' | 'synthesizing' | 'result' | 'error'

interface PaidSource {
  sourceId: string
  name: string
  txHash: string
  snippet: string
}

export function ResearchFlow({ agent, initialTopic, initialSourceIds }: {
  agent: Agent; initialTopic?: string; initialSourceIds?: string[]
}) {
  const { quotePayment, executePayment } = useStore()
  const [sources, setSources] = useState<DemoSource[]>([])
  const [topic, setTopic] = useState(initialTopic || '')
  const [selected, setSelected] = useState<string[]>(initialSourceIds || [])
  const [step, setStep] = useState<Step>('form')
  const [privKey, setPrivKey] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [paid, setPaid] = useState<PaidSource[]>([])
  const [report, setReport] = useState('')
  const [sourceSuggestion, setSourceSuggestion] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)

  useEffect(() => {
    fetch(`${API}/demo/sources`).then(r => r.json()).then(d => setSources(d.sources || [])).catch(() => {})
  }, [])

  const suggestSources = async () => {
    if (!topic.trim()) return
    setSuggesting(true)
    setSourceSuggestion(null)
    try {
      const res = await fetch(`${API}/agents/research/recommend-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      setSourceSuggestion(data.insight || 'No suggestion available.')
    } catch {
      setSourceSuggestion(null)
    }
    setSuggesting(false)
  }

  const totalCost = sources.filter(s => selected.includes(s.id)).reduce((sum, s) => sum + s.price, 0)

  const toggle = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const runResearch = async () => {
    if (!topic.trim() || selected.length === 0) return
    setStep('sign')
  }

  const payAndSynthesize = async () => {
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      setStep('error')
      return
    }

    setStep('paying')
    const results: PaidSource[] = []
    for (const sourceId of selected) {
      const source = sources.find(s => s.id === sourceId)!
      setProgress(`Quoting ${source.name}…`)
      const resourceUrl = `${API}/demo/resource/${sourceId}`
      const quote = await quotePayment(agent.id, resourceUrl)
      if (!quote) {
        setPrivKey('')
        setError(`Could not get a quote for ${source.name}`)
        setStep('error')
        return
      }

      setProgress(`Paying for ${source.name}…`)
      const pay = await payWithAgentWallet(privKey, quote.quote.payTo, parseFloat(quote.quote.amount))
      if (!pay.ok || !pay.hash) {
        setPrivKey('')
        setError(pay.error || `Payment failed for ${source.name}`)
        setStep('error')
        return
      }

      setProgress(`Verifying payment and unlocking ${source.name}…`)
      const exec = await executePayment(agent.id, resourceUrl, pay.hash)
      if (!exec.ok) {
        setPrivKey('')
        setError(exec.error || `Backend could not verify payment for ${source.name}`)
        setStep('error')
        return
      }

      const snippet = JSON.stringify(exec.resource?.result ?? exec.resource ?? {})
      results.push({ sourceId, name: source.name, txHash: pay.hash, snippet })
    }
    setPrivKey('')
    setPaid(results)

    setStep('synthesizing')
    try {
      const res = await fetch(`${API}/agents/research/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, snippets: results.map(r => r.snippet) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Report synthesis failed')
        setStep('error')
        return
      }
      setReport(data.report)
      setStep('result')
    } catch {
      setError('Backend offline during synthesis')
      setStep('error')
    }
  }

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Research a topic</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        This agent pays real USDC on Base for each data source it consults, then synthesizes
        a report from what it bought.
      </div>

      {step === 'form' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="field-label" style={{ marginBottom: 0 }}>Topic</div>
            <button className="btn-ghost" style={{ fontSize: 10.5, padding: '4px 10px' }} disabled={!topic.trim() || suggesting} onClick={suggestSources}>
              {suggesting ? 'Thinking…' : '🧭 Suggest sources'}
            </button>
          </div>
          <input className="field-input" style={{ marginBottom: 8 }} placeholder="e.g. Base network activity this week"
            value={topic} onChange={e => setTopic(e.target.value)} />
          {sourceSuggestion && (
            <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginBottom: 16, lineHeight: 1.5 }}>{sourceSuggestion}</div>
          )}

          <div className="field-label" style={{ marginBottom: 8 }}>Sources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {sources.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card2)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{s.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{s.description}</div>
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--green)' }}>${s.price.toFixed(2)}</div>
              </label>
            ))}
            {sources.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Loading sources… (backend must be running)</div>}
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>
            Estimated cost: <span className="mono" style={{ color: 'var(--ink2)' }}>${totalCost.toFixed(2)}</span> · Daily budget ${agent.dailyLimit}
          </div>

          <button className="btn-primary-lg" style={{ width: '100%' }} disabled={!topic.trim() || selected.length === 0} onClick={runResearch}>
            Run research →
          </button>
        </>
      )}

      {step === 'sign' && (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 12 }}>
            About to pay for {selected.length} source{selected.length > 1 ? 's' : ''} (~${totalCost.toFixed(2)} total).
          </div>
          <div className="field-label">Agent private key</div>
          <input className="field-input" style={{ marginBottom: 8 }} type="password" placeholder="0x…"
            value={privKey} onChange={e => setPrivKey(e.target.value)} />
          <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginBottom: 18, lineHeight: 1.5 }}>
            Used once, locally in your browser, to sign each transfer. Never sent to or stored by our backend.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('form')}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!privKey} onClick={payAndSynthesize}>
              Sign &amp; pay all →
            </button>
          </div>
        </>
      )}

      {(step === 'paying' || step === 'synthesizing') && (
        <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>
          {step === 'paying' ? progress : 'Synthesizing report from purchased data…'}
        </div>
      )}

      {step === 'result' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>✓ Report ready</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--card2)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            {report}
          </div>
          <div className="field-label" style={{ marginBottom: 8 }}>Sources used</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {paid.map(p => (
              <a key={p.sourceId} href={`https://basescan.org/tx/${p.txHash}`} target="_blank" rel="noreferrer"
                className="mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
                {p.name} · {p.txHash.slice(0, 10)}… ↗
              </a>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setStep('form'); setReport(''); setPaid([]); setSelected([]); setTopic('') }}>
            New research
          </button>
        </>
      )}

      {step === 'error' && (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--rose)', marginBottom: 18, lineHeight: 1.5 }}>{error}</div>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => { setError(''); setStep('form') }}>Back</button>
        </>
      )}
    </div>
  )
}

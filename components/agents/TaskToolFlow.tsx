'use client'
import { ReactNode, useEffect, useState } from 'react'
import { Agent, TrustChallenge, useStore } from '@/lib/store'
import { payWithAgentWallet, agentAddressFromKey } from '@/lib/x407-agent-pay'
import { TrustChallengeNotice } from '@/components/agents/TrustChallengeNotice'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'form' | 'sign' | 'paying' | 'result' | 'error'

/**
 * Generic "pay a fixed demo tool fee, then get a real result" flow — shared by
 * the six task agents whose value is real reasoning/lookups (backend/task_tools.py)
 * rather than a recurring real-world recipient. Same quote/sign/pay/verify rail as
 * every other flow, just a single fixed source instead of Research Bot's picker.
 */
export function TaskToolFlow({
  agent, sourceId, title, description, inputLabel, inputPlaceholder,
  secondaryLabel, secondaryPlaceholder, initialInput, formatResult, onResult,
}: {
  agent: Agent
  sourceId: string
  title: string
  description: string
  inputLabel: string
  inputPlaceholder: string
  secondaryLabel?: string
  secondaryPlaceholder?: string
  initialInput?: string
  formatResult?: (result: any) => ReactNode
  onResult?: (result: any, input: string) => void
}) {
  const { quotePayment, executePayment } = useStore()
  const [price, setPrice] = useState<number | null>(null)
  const [input, setInput] = useState(initialInput || '')
  const [secondary, setSecondary] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [privKey, setPrivKey] = useState('')
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')
  const [result, setResult] = useState<any>(null)
  const [trustChallenge, setTrustChallenge] = useState<TrustChallenge | null>(null)

  useEffect(() => {
    fetch(`${API}/demo/sources`).then(r => r.json())
      .then(d => setPrice((d.sources || []).find((s: any) => s.id === sourceId)?.price ?? null))
      .catch(() => {})
  }, [sourceId])

  const topic = secondaryLabel ? `${input}:${secondary || 'npm'}` : input

  const run = () => {
    if (!input.trim()) return
    setError(''); setTrustChallenge(null)
    setStep('sign')
  }

  const payAndRun = async () => {
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      setStep('error')
      return
    }
    setStep('paying')
    setTrustChallenge(null)
    const resourceUrl = `${API}/demo/resource/${sourceId}?topic=${encodeURIComponent(topic)}`

    const quoteResult = await quotePayment(agent.id, resourceUrl)
    if (quoteResult && 'trustChallenge' in quoteResult) {
      setPrivKey(''); setTrustChallenge(quoteResult.trustChallenge); setStep('error')
      return
    }
    if (!quoteResult) {
      setPrivKey(''); setError('Could not get a quote for this task'); setStep('error')
      return
    }

    const pay = await payWithAgentWallet(privKey, quoteResult.quote.payTo, parseFloat(quoteResult.quote.amount))
    if (!pay.ok || !pay.hash) {
      setPrivKey(''); setError(pay.error || 'Payment failed'); setStep('error')
      return
    }

    const exec = await executePayment(agent.id, resourceUrl, pay.hash)
    setPrivKey('')
    if (!exec.ok) {
      setError(exec.error || 'Backend could not verify the payment'); setStep('error')
      return
    }
    setTxHash(pay.hash)
    setResult(exec.resource?.result ?? exec.resource ?? null)
    onResult?.(exec.resource?.result ?? exec.resource ?? null, input)
    setStep('result')
  }

  const reset = () => { setStep('form'); setInput(''); setSecondary(''); setResult(null); setTxHash('') }

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>{description}</div>

      {step === 'form' && (
        <>
          <div className="field-label">{inputLabel}</div>
          <textarea
            className="field-input" style={{ marginBottom: secondaryLabel ? 8 : 12, minHeight: 72, resize: 'vertical', fontFamily: 'var(--font)' }}
            placeholder={inputPlaceholder} value={input} onChange={e => setInput(e.target.value)}
          />
          {secondaryLabel && (
            <input className="field-input" style={{ marginBottom: 12 }} placeholder={secondaryPlaceholder} value={secondary} onChange={e => setSecondary(e.target.value)} />
          )}
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>
            Cost: <span className="mono" style={{ color: 'var(--ink2)' }}>{price !== null ? `$${price.toFixed(2)}` : '…'}</span> · Daily budget ${agent.dailyLimit}
          </div>
          <button className="btn-primary-lg" style={{ width: '100%' }} disabled={!input.trim()} onClick={run}>Run →</button>
        </>
      )}

      {step === 'sign' && (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 12 }}>
            About to pay ${price?.toFixed(2) ?? '…'} for this task.
          </div>
          <div className="field-label">Agent private key</div>
          <input className="field-input" style={{ marginBottom: 8 }} type="password" placeholder="0x…"
            value={privKey} onChange={e => setPrivKey(e.target.value)} />
          <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginBottom: 18, lineHeight: 1.5 }}>
            Used once, locally in your browser, to sign this transfer. Never sent to or stored by our backend.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('form')}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!privKey} onClick={payAndRun}>Sign &amp; pay →</button>
          </div>
        </>
      )}

      {step === 'paying' && <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>Paying and running…</div>}

      {step === 'result' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>✓ Done</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.6, background: 'var(--card2)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            {formatResult ? formatResult(result) : (result?.output || JSON.stringify(result))}
          </div>
          {txHash && (
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer"
              className="mono" style={{ fontSize: 10.5, color: 'var(--ink3)', display: 'block', marginBottom: 16 }}>
              {txHash.slice(0, 10)}… ↗
            </a>
          )}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={reset}>Run another</button>
        </>
      )}

      {step === 'error' && (
        <>
          {trustChallenge
            ? <div style={{ marginBottom: 18 }}><TrustChallengeNotice challenge={trustChallenge} /></div>
            : <div style={{ fontSize: 12.5, color: 'var(--rose)', marginBottom: 18, lineHeight: 1.5 }}>{error}</div>}
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => { setError(''); setTrustChallenge(null); setStep('form') }}>Back</button>
        </>
      )}
    </div>
  )
}

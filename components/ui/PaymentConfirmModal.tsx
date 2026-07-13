'use client'
import { useEffect, useState } from 'react'
import { useStore, PaymentQuote } from '@/lib/store'
import { payWithAgentWallet, agentAddressFromKey } from '@/lib/x407-agent-pay'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'loading' | 'review' | 'sign' | 'paying' | 'verifying' | 'success' | 'error'

export function PaymentConfirmModal({ agentId, resourceUrl, onClose }: {
  agentId: string
  resourceUrl?: string
  onClose: () => void
}) {
  const { quotePayment, executePayment } = useStore()
  const [step, setStep]       = useState<Step>('loading')
  const [quote, setQuote]     = useState<PaymentQuote | null>(null)
  const [privKey, setPrivKey] = useState('')
  const [error, setError]     = useState('')
  const [txHash, setTxHash]   = useState('')
  const [insight, setInsight] = useState<string | null>(null)

  const load = async () => {
    setStep('loading')
    setInsight(null)
    const q = await quotePayment(agentId, resourceUrl)
    if (!q) { setError('Could not get a payment quote — is the backend reachable and is DEMO_MERCHANT_ADDRESS configured?'); setStep('error'); return }
    setQuote(q)
    setStep('review')
    fetch(`${API}/payments/reason`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: q.quote.description, amount: parseFloat(q.quote.amount) }),
    }).then(r => r.json()).then(d => setInsight(d.insight || null)).catch(() => {})
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const approve = () => setStep('sign')

  const signAndPay = async () => {
    if (!quote) return
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== quote.agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      setStep('error')
      return
    }
    setStep('paying')
    const amount = parseFloat(quote.quote.amount)
    const result = await payWithAgentWallet(privKey, quote.quote.payTo, amount)
    setPrivKey('') // never held longer than needed to sign
    if (!result.ok || !result.hash) {
      setError(result.error || 'Payment transaction failed')
      setStep('error')
      return
    }
    setTxHash(result.hash)
    setStep('verifying')

    const exec = await executePayment(agentId, quote.resourceUrl, result.hash)
    if (!exec.ok) {
      setError(exec.error || 'Backend could not verify the on-chain payment')
      setStep('error')
      return
    }
    setStep('success')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 420, width: '90%' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Pay for API access</div>

        {step === 'loading' && (
          <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>Requesting quote from resource…</div>
        )}

        {step === 'review' && quote && (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 16, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>{quote.agent.name}</strong> wants to pay for:
              <div style={{ marginTop: 8, background: 'var(--card2)', borderRadius: 10, padding: 12 }}>
                <Row label="Description" value={quote.quote.description} />
                <Row label="Amount" value={`${quote.quote.amount} USDC`} />
                <Row label="Network" value={quote.quote.network} />
                <Row label="Pays to" value={quote.quote.payTo} mono />
                <Row label="Resource" value={quote.resourceUrl} mono />
              </div>
            </div>
            {insight && (
              <div style={{ fontSize: 11, color: 'var(--ink2)', lineHeight: 1.5, marginBottom: 16, display: 'flex', gap: 6 }}>
                <span style={{ flexShrink: 0 }}>🧭</span><span>{insight}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={approve}>Approve &amp; pay →</button>
            </div>
          </>
        )}

        {step === 'sign' && quote && (
          <>
            <div className="field-label">Agent private key</div>
            <input
              className="field-input" style={{ marginBottom: 8 }}
              type="password" placeholder="0x…"
              value={privKey} onChange={e => setPrivKey(e.target.value)}
            />
            <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginBottom: 18, lineHeight: 1.5 }}>
              Used once, locally in your browser, to sign this one transfer. It is never sent to
              or stored by our backend.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={signAndPay} disabled={!privKey}>
                Sign &amp; send →
              </button>
            </div>
          </>
        )}

        {(step === 'paying' || step === 'verifying') && (
          <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>
            {step === 'paying' ? 'Broadcasting USDC transfer on Base…' : 'Verifying payment on-chain and unlocking resource…'}
          </div>
        )}

        {step === 'success' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 10 }}>✓ Payment confirmed</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', wordBreak: 'break-all', marginBottom: 18 }}>
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ink2)' }}>
                {txHash} ↗
              </a>
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Done</button>
          </>
        )}

        {step === 'error' && (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--rose)', marginBottom: 18, lineHeight: 1.5 }}>{error}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Close</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setError(''); load() }}>Retry</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
      <span style={{ color: 'var(--ink3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontSize: 11.5, fontFamily: mono ? 'var(--mono)' : undefined, textAlign: 'right', wordBreak: 'break-all', maxWidth: '70%' }}>{value}</span>
    </div>
  )
}

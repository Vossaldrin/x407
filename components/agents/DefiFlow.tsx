'use client'
import { useEffect, useState } from 'react'
import { Agent } from '@/lib/store'
import { executeSwap } from '@/lib/defi-swap'
import { agentAddressFromKey } from '@/lib/x402-agent-pay'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'form' | 'quoted' | 'sign' | 'swapping' | 'result' | 'error'

interface Quote {
  fromToken: string
  toToken: string
  amountIn: number
  amountOut: number
  fee: number
}

export function DefiFlow({ agent, initialFromToken, initialAmountIn }: {
  agent: Agent; initialFromToken?: 'ETH' | 'USDC'; initialAmountIn?: number
}) {
  const [fromToken, setFromToken] = useState<'ETH' | 'USDC'>(initialFromToken || 'ETH')
  const [amountIn, setAmountIn] = useState(initialAmountIn ? String(initialAmountIn) : '0.01')
  const [step, setStep] = useState<Step>('form')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [privKey, setPrivKey] = useState('')
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')
  const [insight, setInsight] = useState<string | null>(null)

  const toToken = fromToken === 'ETH' ? 'USDC' : 'ETH'

  const getQuote = async () => {
    setError('')
    setInsight(null)
    try {
      const res = await fetch(`${API}/defi/quote?agentId=${agent.id}&fromToken=${fromToken}&toToken=${toToken}&amountIn=${amountIn}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not get a quote')
        setStep('error')
        return
      }
      setQuote(data.quote)
      setStep('quoted')
      fetch(`${API}/defi/reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, ...data.quote }),
      }).then(r => r.json()).then(d => setInsight(d.insight || null)).catch(() => {})
    } catch {
      setError('Backend offline')
      setStep('error')
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initialFromToken && initialAmountIn) getQuote() }, [])

  const swap = async () => {
    if (!quote) return
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      setStep('error')
      return
    }
    setStep('swapping')
    // 1% slippage tolerance on the quoted output
    const minOut = quote.amountOut * 0.99
    const result = await executeSwap(privKey, quote.fromToken as 'ETH' | 'USDC', quote.toToken as 'ETH' | 'USDC', quote.amountIn, quote.fee, minOut)
    setPrivKey('')
    if (!result.ok || !result.hash) {
      setError(result.error || 'Swap transaction failed')
      setStep('error')
      return
    }
    setTxHash(result.hash)

    const exec = await fetch(`${API}/defi/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agent.id, fromToken: quote.fromToken, toToken: quote.toToken, txHash: result.hash }),
    })
    const data = await exec.json()
    if (!exec.ok) {
      setError(data.detail || 'Backend could not verify the swap')
      setStep('error')
      return
    }
    setStep('result')
  }

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Swap (Uniswap V3 · Base)</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        Real on-chain swap executed by the agent's own wallet. v1 supports ETH ↔ USDC only.
        Max trade size is capped by this agent's daily/per-tx limits, not a realized-P&amp;L tracker.
      </div>

      {step === 'form' && (
        <>
          <div className="field-label">From</div>
          <div className="chip-group" style={{ marginBottom: 14 }}>
            {(['ETH', 'USDC'] as const).map(t => (
              <button key={t} className={`chip ${fromToken === t ? 'on' : ''}`} onClick={() => setFromToken(t)}>{t}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>Swapping to <strong style={{ color: 'var(--ink2)' }}>{toToken}</strong></div>
          <div className="field-label">Amount ({fromToken})</div>
          <input className="field-input" style={{ marginBottom: 18 }} type="number" step="0.0001" value={amountIn} onChange={e => setAmountIn(e.target.value)} />
          <button className="btn-primary-lg" style={{ width: '100%' }} disabled={!amountIn || parseFloat(amountIn) <= 0} onClick={getQuote}>
            Get quote →
          </button>
        </>
      )}

      {step === 'quoted' && quote && (
        <>
          <div style={{ background: 'var(--card2)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 4 }}>
              {quote.amountIn} {quote.fromToken} → ~{quote.amountOut.toFixed(6)} {quote.toToken}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>Pool fee: {quote.fee / 10000}% · 1% slippage tolerance</div>
          </div>
          {insight && (
            <div style={{ fontSize: 11, color: 'var(--ink2)', lineHeight: 1.5, marginBottom: 16, display: 'flex', gap: 8 }}>
              <span style={{ flexShrink: 0 }}>🧭</span>
              <span>{insight}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('form')}>Back</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setStep('sign')}>
              Approve &amp; swap →
            </button>
          </div>
        </>
      )}

      {step === 'sign' && (
        <>
          <div className="field-label">Agent private key</div>
          <input className="field-input" style={{ marginBottom: 8 }} type="password" placeholder="0x…"
            value={privKey} onChange={e => setPrivKey(e.target.value)} />
          <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginBottom: 18, lineHeight: 1.5 }}>
            Used once, locally in your browser, to sign the approve (if needed) and swap
            transactions. Never sent to or stored by our backend.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('quoted')}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!privKey} onClick={swap}>
              Sign &amp; swap →
            </button>
          </div>
        </>
      )}

      {step === 'swapping' && (
        <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>Broadcasting swap on Base and verifying on-chain…</div>
      )}

      {step === 'result' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 10 }}>✓ Swap confirmed</div>
          <div className="mono" style={{ fontSize: 11, wordBreak: 'break-all', marginBottom: 18 }}>
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ink2)' }}>{txHash} ↗</a>
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setStep('form'); setQuote(null) }}>
            New swap
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

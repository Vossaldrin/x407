'use client'
import { useEffect, useState } from 'react'
import { Agent, useStore } from '@/lib/store'
import { searchTravel, TravelOption } from '@/lib/travel-catalog'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'search' | 'results' | 'confirm' | 'booked' | 'error'

export function TravelFlow({ agent, initialDestination, initialMaxBudget }: {
  agent: Agent; initialDestination?: string; initialMaxBudget?: number
}) {
  const { simulatePayment } = useStore()
  const [destination, setDestination] = useState(initialDestination || '')
  const [budget, setBudget] = useState(String(initialMaxBudget || agent.perTxLimit || 500))
  const [step, setStep] = useState<Step>('search')
  const [options, setOptions] = useState<TravelOption[]>([])
  const [picked, setPicked] = useState<TravelOption | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(false)
  const [bestValueInsight, setBestValueInsight] = useState<string | null>(null)

  const search = (dest?: string, maxBudget?: string) => {
    const d = dest ?? destination
    if (!d.trim()) return
    const results = searchTravel(d, parseFloat(maxBudget ?? budget) || 0)
    setOptions(results)
    setStep('results')
    setBestValueInsight(null)
    if (results.length > 0) {
      fetch(`${API}/travel/rationale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: d, options: results.map(o => ({ name: o.name, type: o.type, price: o.price })) }),
      }).then(r => r.json()).then(res => setBestValueInsight(res.insight || null)).catch(() => {})
    }
  }

  useEffect(() => {
    if (initialDestination) search(initialDestination, initialMaxBudget ? String(initialMaxBudget) : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const book = async () => {
    if (!picked) return
    setBooking(true)
    const result = await simulatePayment(agent.id, `travel:${picked.id}`, picked.price, `${picked.name} — ${picked.detail}`)
    setBooking(false)
    if (!result.ok) {
      setError(result.error || 'Booking payment failed')
      setStep('error')
      return
    }
    setConfirmationCode('BK-' + Math.random().toString(36).slice(2, 9).toUpperCase())
    setStep('booked')
  }

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Book travel</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        Simulated demo — searches a mock catalog of flights and hotels within your budget and
        rules. No real travel provider is booked.
      </div>

      {step === 'search' && (
        <>
          <div className="field-label">Destination</div>
          <input className="field-input" style={{ marginBottom: 14 }} placeholder="e.g. Lisbon"
            value={destination} onChange={e => setDestination(e.target.value)} />
          <div className="field-label">Max budget ($)</div>
          <input className="field-input" style={{ marginBottom: 18 }} type="number" value={budget} onChange={e => setBudget(e.target.value)} />
          <button className="btn-primary-lg" style={{ width: '100%' }} disabled={!destination.trim()} onClick={() => search()}>
            Search →
          </button>
        </>
      )}

      {step === 'results' && (
        <>
          {bestValueInsight && (
            <div style={{ fontSize: 11, color: 'var(--ink2)', lineHeight: 1.5, marginBottom: 12, display: 'flex', gap: 6 }}>
              <span style={{ flexShrink: 0 }}>🧭</span><span>{bestValueInsight}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {options.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>No results within budget.</div>}
            {options.map(o => (
              <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card2)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}>
                <input type="radio" name="travel-option" checked={picked?.id === o.id} onChange={() => setPicked(o)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{o.type === 'flight' ? '✈️' : '🏨'} {o.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{o.detail}</div>
                </div>
                <div className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>${o.price.toFixed(2)}</div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('search')}>Back</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!picked} onClick={() => setStep('confirm')}>
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 'confirm' && picked && (
        <>
          <div style={{ background: 'var(--card2)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 4 }}>{picked.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>{picked.detail}</div>
            <div className="mono" style={{ fontSize: 14, color: 'var(--ink)' }}>${picked.price.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('results')}>Back</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={booking} onClick={book}>
              {booking ? 'Booking…' : 'Confirm & book →'}
            </button>
          </div>
        </>
      )}

      {step === 'booked' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 10 }}>✓ Booking confirmed</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18 }}>Confirmation code: {confirmationCode}</div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setStep('search'); setDestination(''); setPicked(null) }}>
            Book another
          </button>
        </>
      )}

      {step === 'error' && (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--rose)', marginBottom: 18 }}>{error}</div>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setStep('confirm')}>Back</button>
        </>
      )}
    </div>
  )
}

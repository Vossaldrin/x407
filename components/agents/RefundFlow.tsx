'use client'
import { useEffect, useState } from 'react'
import { Agent, TrustChallenge, useStore } from '@/lib/store'
import { payWithAgentWallet, agentAddressFromKey } from '@/lib/x407-agent-pay'
import { TrustChallengeNotice } from '@/components/agents/TrustChallengeNotice'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Refund {
  id: string
  customerName: string
  reason: string
  amount: number
  payToAddress: string
  paid: boolean
}

export function RefundFlow({ agent, initialCustomerName, initialAmount, initialPayToAddress }: {
  agent: Agent; initialCustomerName?: string; initialAmount?: number; initialPayToAddress?: string
}) {
  const { quotePayment, executePayment } = useStore()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(!!initialCustomerName)
  const [customerName, setCustomerName] = useState(initialCustomerName || '')
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '')
  const [payTo, setPayTo] = useState(initialPayToAddress || '')
  const [adding, setAdding] = useState(false)

  const [payingRefund, setPayingRefund] = useState<Refund | null>(null)
  const [privKey, setPrivKey] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [trustChallenge, setTrustChallenge] = useState<TrustChallenge | null>(null)

  const loadRefunds = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/refunds`)
      const data = await res.json()
      setRefunds(data.refunds || [])
    } catch { /* offline */ }
    setLoading(false)
  }

  useEffect(() => { loadRefunds() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addRefund = async () => {
    if (!customerName.trim() || !amount || !payTo.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customerName.trim(), reason: reason.trim() || 'Refund', amount: parseFloat(amount), payToAddress: payTo.trim() }),
      })
      if (res.ok) {
        setCustomerName(''); setReason(''); setAmount(''); setPayTo(''); setShowAdd(false)
        await loadRefunds()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.detail === 'string' ? body.detail : 'Could not add refund')
      }
    } catch {
      setError('Backend offline')
    }
    setAdding(false)
  }

  const removeRefund = async (refund: Refund) => {
    await fetch(`${API}/agents/${agent.id}/refunds/${refund.id}`, { method: 'DELETE' }).catch(() => {})
    loadRefunds()
  }

  const startPay = (refund: Refund) => {
    setError(''); setTrustChallenge(null)
    setPayingRefund(refund)
  }

  const payRefund = async () => {
    if (!payingRefund) return
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      return
    }
    setPaying(true)
    setError(''); setTrustChallenge(null)
    const resourceUrl = `${API}/refunds/${payingRefund.id}/invoice`

    const quoteResult = await quotePayment(agent.id, resourceUrl)
    if (quoteResult && 'trustChallenge' in quoteResult) {
      setPrivKey(''); setPaying(false)
      setTrustChallenge(quoteResult.trustChallenge)
      return
    }
    if (!quoteResult) {
      setPrivKey(''); setPaying(false)
      setError('Could not get a quote for this refund')
      return
    }

    const pay = await payWithAgentWallet(privKey, quoteResult.quote.payTo, parseFloat(quoteResult.quote.amount))
    if (!pay.ok || !pay.hash) {
      setPrivKey(''); setPaying(false)
      setError(pay.error || 'Payment failed')
      return
    }

    const exec = await executePayment(agent.id, resourceUrl, pay.hash)
    setPrivKey(''); setPaying(false)
    if (!exec.ok) {
      setError(exec.error || 'Backend could not verify the payment')
      return
    }
    setPayingRefund(null)
    loadRefunds()
  }

  const totalPending = refunds.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0)

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Refunds</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        Real payment rail — add a refund with the customer's real wallet address, and this
        agent pays it in real USDC on Base, checked against its limits. There's no
        support-ticket integration — you tell it who to pay.
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending refunds</div>
          <div className="mono" style={{ fontSize: 15, color: 'var(--ink)' }}>${totalPending.toFixed(2)}</div>
        </div>
      </div>

      {error && !trustChallenge && <div style={{ fontSize: 11.5, color: 'var(--rose)', marginBottom: 12 }}>{error}</div>}
      {trustChallenge && <div style={{ marginBottom: 12 }}><TrustChallengeNotice challenge={trustChallenge} /></div>}

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Loading refunds…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {refunds.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>No refunds yet — add one below.</div>}
          {refunds.map(refund => (
            <div key={refund.id} style={{ background: 'var(--card2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{refund.customerName}</div>
                  <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink3)' }}>{refund.reason} · {refund.payToAddress.slice(0, 6)}…{refund.payToAddress.slice(-4)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>${refund.amount.toFixed(2)}</span>
                  {refund.paid ? (
                    <span className="badge badge-green">paid</span>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => startPay(refund)}>Pay</button>
                  )}
                  <button className="icon-btn icon-btn-danger" style={{ width: 26, height: 26 }} onClick={() => removeRefund(refund)} title="Remove">×</button>
                </div>
              </div>

              {payingRefund?.id === refund.id && (
                <div style={{ marginTop: 10, borderTop: '0.5px solid var(--line)', paddingTop: 10 }}>
                  <input
                    className="field-input" style={{ marginBottom: 8 }}
                    type="password" placeholder="Agent private key — 0x…"
                    value={privKey} onChange={e => setPrivKey(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => { setPayingRefund(null); setPrivKey('') }}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 2, fontSize: 11, justifyContent: 'center' }} disabled={!privKey || paying} onClick={payRefund}>
                      {paying ? 'Paying…' : `Sign & pay $${refund.amount.toFixed(2)} →`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div style={{ background: 'var(--card2)', borderRadius: 8, padding: 12 }}>
          <input className="field-input" style={{ marginBottom: 8 }} placeholder="Customer name"
            value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="field-input" placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
            <input className="field-input" type="number" placeholder="Amount (USDC)" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <input className="field-input" style={{ marginBottom: 10 }} placeholder="Customer wallet address — 0x…"
            value={payTo} onChange={e => setPayTo(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, fontSize: 11, justifyContent: 'center' }}
              disabled={!customerName.trim() || !amount || !payTo.trim() || adding} onClick={addRefund}>
              {adding ? 'Adding…' : 'Add refund'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary-lg" style={{ width: '100%' }} onClick={() => setShowAdd(true)}>+ Add a refund</button>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { Agent, TrustChallenge, useStore } from '@/lib/store'
import { payWithAgentWallet, agentAddressFromKey } from '@/lib/x407-agent-pay'
import { TrustChallengeNotice } from '@/components/agents/TrustChallengeNotice'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Bill {
  id: string
  name: string
  category: string
  amount: number
  payToAddress: string
  paid: boolean
}

export function FinanceFlow({ agent, initialBillName, initialAmount, initialPayToAddress }: {
  agent: Agent; initialBillName?: string; initialAmount?: number; initialPayToAddress?: string
}) {
  const { quotePayment, executePayment } = useStore()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(!!initialBillName)
  const [name, setName] = useState(initialBillName || '')
  const [category, setCategory] = useState('Subscriptions')
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '')
  const [payTo, setPayTo] = useState(initialPayToAddress || '')
  const [adding, setAdding] = useState(false)

  const [payingBill, setPayingBill] = useState<Bill | null>(null)
  const [privKey, setPrivKey] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [trustChallenge, setTrustChallenge] = useState<TrustChallenge | null>(null)

  const loadBills = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/bills`)
      const data = await res.json()
      setBills(data.bills || [])
    } catch { /* offline */ }
    setLoading(false)
  }

  useEffect(() => { loadBills() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addBill = async () => {
    if (!name.trim() || !amount || !payTo.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category, amount: parseFloat(amount), payToAddress: payTo.trim() }),
      })
      if (res.ok) {
        setName(''); setAmount(''); setPayTo(''); setShowAdd(false)
        await loadBills()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.detail === 'string' ? body.detail : 'Could not add bill')
      }
    } catch {
      setError('Backend offline')
    }
    setAdding(false)
  }

  const removeBill = async (bill: Bill) => {
    await fetch(`${API}/agents/${agent.id}/bills/${bill.id}`, { method: 'DELETE' }).catch(() => {})
    loadBills()
  }

  const startPay = (bill: Bill) => {
    setError(''); setTrustChallenge(null)
    setPayingBill(bill)
  }

  const payBill = async () => {
    if (!payingBill) return
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      return
    }
    setPaying(true)
    setError(''); setTrustChallenge(null)
    const resourceUrl = `${API}/bills/${payingBill.id}/invoice`

    const quoteResult = await quotePayment(agent.id, resourceUrl)
    if (quoteResult && 'trustChallenge' in quoteResult) {
      setPrivKey(''); setPaying(false)
      setTrustChallenge(quoteResult.trustChallenge)
      return
    }
    if (!quoteResult) {
      setPrivKey(''); setPaying(false)
      setError('Could not get a quote for this bill')
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
    setPayingBill(null)
    loadBills()
  }

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Bills</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        Real payment rail — add a bill with a recipient address (yours, or a vendor's real
        address), and this agent pays it in real USDC on Base, checked against its limits.
        There's no bank or subscription auto-detection — you tell it what to pay.
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tracked bills</div>
          <div className="mono" style={{ fontSize: 15, color: 'var(--ink)' }}>${totalMonthly.toFixed(2)}</div>
        </div>
      </div>

      {error && !trustChallenge && <div style={{ fontSize: 11.5, color: 'var(--rose)', marginBottom: 12 }}>{error}</div>}
      {trustChallenge && <div style={{ marginBottom: 12 }}><TrustChallengeNotice challenge={trustChallenge} /></div>}

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Loading bills…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {bills.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>No bills yet — add one below.</div>}
          {bills.map(bill => (
            <div key={bill.id} style={{ background: 'var(--card2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{bill.name}</div>
                  <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink3)' }}>{bill.category} · {bill.payToAddress.slice(0, 6)}…{bill.payToAddress.slice(-4)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>${bill.amount.toFixed(2)}</span>
                  {bill.paid ? (
                    <span className="badge badge-green">paid</span>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => startPay(bill)}>Pay</button>
                  )}
                  <button className="icon-btn icon-btn-danger" style={{ width: 26, height: 26 }} onClick={() => removeBill(bill)} title="Remove">×</button>
                </div>
              </div>

              {payingBill?.id === bill.id && (
                <div style={{ marginTop: 10, borderTop: '0.5px solid var(--line)', paddingTop: 10 }}>
                  <input
                    className="field-input" style={{ marginBottom: 8 }}
                    type="password" placeholder="Agent private key — 0x…"
                    value={privKey} onChange={e => setPrivKey(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => { setPayingBill(null); setPrivKey('') }}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 2, fontSize: 11, justifyContent: 'center' }} disabled={!privKey || paying} onClick={payBill}>
                      {paying ? 'Paying…' : `Sign & pay $${bill.amount.toFixed(2)} →`}
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
          <input className="field-input" style={{ marginBottom: 8 }} placeholder="Bill name (e.g. Spotify)"
            value={name} onChange={e => setName(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="field-input" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
            <input className="field-input" type="number" placeholder="Amount (USDC)" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <input className="field-input" style={{ marginBottom: 10 }} placeholder="Recipient address — 0x…"
            value={payTo} onChange={e => setPayTo(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, fontSize: 11, justifyContent: 'center' }}
              disabled={!name.trim() || !amount || !payTo.trim() || adding} onClick={addBill}>
              {adding ? 'Adding…' : 'Add bill'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary-lg" style={{ width: '100%' }} onClick={() => setShowAdd(true)}>+ Add a bill</button>
      )}
    </div>
  )
}

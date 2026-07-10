'use client'
import { useEffect, useState } from 'react'
import { Agent, useStore } from '@/lib/store'
import { FINANCE_CATALOG, Bill } from '@/lib/finance-catalog'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function FinanceFlow({ agent, initialBillName, initialAction }: {
  agent: Agent; initialBillName?: string; initialAction?: 'pay' | 'switch'
}) {
  const { simulatePayment } = useStore()
  const [bills, setBills] = useState<Bill[]>(FINANCE_CATALOG)
  const [paidIds, setPaidIds] = useState<string[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [rationales, setRationales] = useState<Record<string, string>>({})

  useEffect(() => {
    FINANCE_CATALOG.filter(b => b.betterDealAvailable).forEach(b => {
      fetch(`${API}/finance/rationale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billName: b.name, amount: b.amount, betterDealAmount: b.betterDealAmount }),
      }).then(r => r.json()).then(d => {
        if (d.insight) setRationales(p => ({ ...p, [b.id]: d.insight }))
      }).catch(() => {})
    })
  }, [])

  const switchDeal = (id: string) => {
    setBills(p => p.map(b => b.id === id && b.betterDealAvailable
      ? { ...b, amount: b.betterDealAmount!, betterDealAvailable: false }
      : b))
  }

  useEffect(() => {
    if (!initialBillName) return
    const match = FINANCE_CATALOG.find(b => b.name.toLowerCase().includes(initialBillName.toLowerCase()) || initialBillName.toLowerCase().includes(b.name.toLowerCase()))
    if (!match) return
    if (initialAction === 'switch' && match.betterDealAvailable) switchDeal(match.id)
    else setConfirming(match.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const payBill = async (bill: Bill) => {
    setPaying(true)
    setError('')
    const result = await simulatePayment(agent.id, `billing:${bill.id}`, bill.amount, `${bill.name} (${bill.category})`)
    setPaying(false)
    if (!result.ok) {
      setError(result.error || 'Payment failed')
      return
    }
    setPaidIds(p => [...p, bill.id])
    setConfirming(null)
  }

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0)
  const totalSavings = FINANCE_CATALOG.filter(b => b.betterDealAvailable).reduce((s, b) => s + (b.amount - (b.betterDealAmount ?? b.amount)), 0)

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Expense optimizer</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        Simulated demo — monitors recurring bills, flags better deals, and pays within your
        limits. No real merchant is charged; every payment still needs your confirmation.
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Monthly total</div>
          <div className="mono" style={{ fontSize: 15, color: 'var(--ink)' }}>${totalMonthly.toFixed(2)}</div>
        </div>
        {totalSavings > 0 && (
          <div>
            <div style={{ fontSize: 9, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Potential savings</div>
            <div className="mono" style={{ fontSize: 15, color: 'var(--green)' }}>${totalSavings.toFixed(2)}/mo</div>
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: 11.5, color: 'var(--rose)', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bills.map(bill => {
          const isPaid = paidIds.includes(bill.id)
          return (
            <div key={bill.id} style={{ background: 'var(--card2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{bill.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{bill.category} · monthly</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>${bill.amount.toFixed(2)}</span>
                  {isPaid ? (
                    <span className="badge badge-green">paid</span>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setConfirming(bill.id)}>Pay now</button>
                  )}
                </div>
              </div>

              {bill.betterDealAvailable && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Better deal found: ${bill.betterDealAmount?.toFixed(2)}/mo</span>
                    <button className="btn-ghost" style={{ fontSize: 10.5, padding: '4px 10px' }} onClick={() => switchDeal(bill.id)}>
                      Switch &amp; save
                    </button>
                  </div>
                  {rationales[bill.id] && (
                    <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 4, display: 'flex', gap: 6 }}>
                      <span>🧭</span><span>{rationales[bill.id]}</span>
                    </div>
                  )}
                </div>
              )}

              {confirming === bill.id && (
                <div style={{ marginTop: 10, borderTop: '0.5px solid var(--line)', paddingTop: 10, display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink2)', flex: 1 }}>Confirm ${bill.amount.toFixed(2)} payment for {bill.name}?</span>
                  <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setConfirming(null)}>Cancel</button>
                  <button className="btn-primary" style={{ fontSize: 11 }} disabled={paying} onClick={() => payBill(bill)}>
                    {paying ? 'Paying…' : 'Confirm'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { Agent, TrustChallenge, useStore } from '@/lib/store'
import { payWithAgentWallet, agentAddressFromKey } from '@/lib/x407-agent-pay'
import { TrustChallengeNotice } from '@/components/agents/TrustChallengeNotice'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface GroceryItem {
  id: string
  item: string
  maxPrice: number
  payToAddress: string
  paid: boolean
}

export function GroceryFlow({ agent, initialItem, initialMaxPrice, initialPayToAddress }: {
  agent: Agent; initialItem?: string; initialMaxPrice?: number; initialPayToAddress?: string
}) {
  const { quotePayment, executePayment } = useStore()
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(!!initialItem)
  const [item, setItem] = useState(initialItem || '')
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice ? String(initialMaxPrice) : '')
  const [payTo, setPayTo] = useState(initialPayToAddress || '')
  const [adding, setAdding] = useState(false)

  const [payingItem, setPayingItem] = useState<GroceryItem | null>(null)
  const [privKey, setPrivKey] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [trustChallenge, setTrustChallenge] = useState<TrustChallenge | null>(null)

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/groceries`)
      const data = await res.json()
      setItems(data.items || [])
    } catch { /* offline */ }
    setLoading(false)
  }

  useEffect(() => { loadItems() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = async () => {
    if (!item.trim() || !maxPrice || !payTo.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/groceries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: item.trim(), maxPrice: parseFloat(maxPrice), payToAddress: payTo.trim() }),
      })
      if (res.ok) {
        setItem(''); setMaxPrice(''); setPayTo(''); setShowAdd(false)
        await loadItems()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.detail === 'string' ? body.detail : 'Could not add item')
      }
    } catch {
      setError('Backend offline')
    }
    setAdding(false)
  }

  const removeItem = async (it: GroceryItem) => {
    await fetch(`${API}/agents/${agent.id}/groceries/${it.id}`, { method: 'DELETE' }).catch(() => {})
    loadItems()
  }

  const startPay = (it: GroceryItem) => {
    setError(''); setTrustChallenge(null)
    setPayingItem(it)
  }

  const payItem = async () => {
    if (!payingItem) return
    const addr = agentAddressFromKey(privKey)
    if (!addr || addr.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      setError("That private key doesn't match this agent's wallet address.")
      return
    }
    setPaying(true)
    setError(''); setTrustChallenge(null)
    const resourceUrl = `${API}/groceries/${payingItem.id}/invoice`

    const quoteResult = await quotePayment(agent.id, resourceUrl)
    if (quoteResult && 'trustChallenge' in quoteResult) {
      setPrivKey(''); setPaying(false)
      setTrustChallenge(quoteResult.trustChallenge)
      return
    }
    if (!quoteResult) {
      setPrivKey(''); setPaying(false)
      setError('Could not get a quote for this item')
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
    setPayingItem(null)
    loadItems()
  }

  const totalPending = items.filter(i => !i.paid).reduce((s, i) => s + i.maxPrice, 0)

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Shopping list</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        Real payment rail — add an item with a target price and the store's real wallet
        address, and this agent pays it in real USDC on Base, checked against its limits.
        There's no cross-retailer price comparison — you set the target price.
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending items</div>
          <div className="mono" style={{ fontSize: 15, color: 'var(--ink)' }}>${totalPending.toFixed(2)}</div>
        </div>
      </div>

      {error && !trustChallenge && <div style={{ fontSize: 11.5, color: 'var(--rose)', marginBottom: 12 }}>{error}</div>}
      {trustChallenge && <div style={{ marginBottom: 12 }}><TrustChallengeNotice challenge={trustChallenge} /></div>}

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Loading list…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>No items yet — add one below.</div>}
          {items.map(it => (
            <div key={it.id} style={{ background: 'var(--card2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{it.item}</div>
                  <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink3)' }}>{it.payToAddress.slice(0, 6)}…{it.payToAddress.slice(-4)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>${it.maxPrice.toFixed(2)}</span>
                  {it.paid ? (
                    <span className="badge badge-green">paid</span>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => startPay(it)}>Pay</button>
                  )}
                  <button className="icon-btn icon-btn-danger" style={{ width: 26, height: 26 }} onClick={() => removeItem(it)} title="Remove">×</button>
                </div>
              </div>

              {payingItem?.id === it.id && (
                <div style={{ marginTop: 10, borderTop: '0.5px solid var(--line)', paddingTop: 10 }}>
                  <input
                    className="field-input" style={{ marginBottom: 8 }}
                    type="password" placeholder="Agent private key — 0x…"
                    value={privKey} onChange={e => setPrivKey(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => { setPayingItem(null); setPrivKey('') }}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 2, fontSize: 11, justifyContent: 'center' }} disabled={!privKey || paying} onClick={payItem}>
                      {paying ? 'Paying…' : `Sign & pay $${it.maxPrice.toFixed(2)} →`}
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
          <input className="field-input" style={{ marginBottom: 8 }} placeholder="Item (e.g. Weekly groceries)"
            value={item} onChange={e => setItem(e.target.value)} />
          <input className="field-input" style={{ marginBottom: 8 }} type="number" placeholder="Target max price (USDC)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          <input className="field-input" style={{ marginBottom: 10 }} placeholder="Store wallet address — 0x…"
            value={payTo} onChange={e => setPayTo(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, fontSize: 11, justifyContent: 'center' }}
              disabled={!item.trim() || !maxPrice || !payTo.trim() || adding} onClick={addItem}>
              {adding ? 'Adding…' : 'Add item'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary-lg" style={{ width: '100%' }} onClick={() => setShowAdd(true)}>+ Add an item</button>
      )}
    </div>
  )
}

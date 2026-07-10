'use client'
import { useState } from 'react'
import { useStore, Transaction } from '@/lib/store'

type Filter = 'all' | 'out' | 'in' | 'blocked'
const TABS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'      },
  { key: 'out',     label: 'Payments' },
  { key: 'in',      label: 'Income'   },
  { key: 'blocked', label: 'Blocked'  },
]

function TxRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const isBlocked = tx.status === 'blocked'
  const isIn      = tx.type === 'in'
  return (
    <div className="tx-row" style={{ borderBottom: last ? 'none' : undefined, display: 'grid', gridTemplateColumns: '30px 1fr auto auto auto', alignItems: 'center', gap: 12 }}>
      <div className={`tx-icon ${isBlocked ? 'tx-blk' : isIn ? 'tx-in' : 'tx-out'}`}>
        {isBlocked ? '⊘' : isIn ? '↓' : '↑'}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{tx.agentName} · {tx.chain} · {tx.address}</div>
      </div>
      <div>
        {tx.status === 'blocked'   && <span className="badge badge-yellow">blocked</span>}
        {tx.status === 'confirmed' && <span className="badge badge-green">confirmed</span>}
        {tx.status === 'pending'   && <span className="badge badge-gray">pending</span>}
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink3)' }}>
        {tx.hash && tx.real ? (
          <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--green)' }}>
            {tx.hash.slice(0, 10)}… ↗
          </a>
        ) : (tx.hash ?? '—')}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 12.5, fontWeight: 500, color: isBlocked ? 'var(--ink3)' : isIn ? 'var(--green)' : 'var(--rose)' }}>
          {isBlocked ? '—' : `${isIn ? '+' : '-'}$${tx.amount.toFixed(2)}`}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{tx.timestamp}</div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const { transactions } = useStore()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = transactions.filter(tx => {
    if (filter === 'all')     return true
    if (filter === 'blocked') return tx.status === 'blocked'
    return tx.type === filter && tx.status !== 'blocked'
  })

  const totalOut     = transactions.filter(t => t.type === 'out' && t.status === 'confirmed').reduce((s, t) => s + t.amount, 0)
  const totalIn      = transactions.filter(t => t.type === 'in'  && t.status === 'confirmed').reduce((s, t) => s + t.amount, 0)
  const blockedCount = transactions.filter(t => t.status === 'blocked').length

  return (
    <div className="animate-up gap-pad">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>Transactions</h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Full ledger of agent and wallet activity.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total paid out</div>
          <div className="stat-value text-red">-${totalOut.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total income</div>
          <div className="stat-value text-green">+${totalIn.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blocked</div>
          <div className="stat-value" style={{ color: blockedCount > 0 ? 'var(--rose)' : 'var(--ink)' }}>{blockedCount}</div>
        </div>
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '0.5px solid var(--line)' }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Transactions</span>
            <span style={{ fontSize: 11, color: 'var(--ink2)', marginLeft: 8 }}>x402 autonomous payments · all agents</span>
          </div>
          <button className="btn-ghost" style={{ fontSize: 11 }}>Export CSV</button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', padding: '0 18px', borderBottom: '0.5px solid var(--line)', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              padding: '10px 0', marginRight: 16, fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font)',
              color: filter === t.key ? 'var(--green)' : 'var(--ink3)',
              background: 'none', border: 'none', borderBottom: filter === t.key ? '2px solid var(--green)' : '2px solid transparent',
              fontWeight: filter === t.key ? 500 : 400,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--ink3)' }}>
            No transactions in this category
          </div>
        ) : (
          filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} last={i === filtered.length - 1} />)
        )}
      </div>
    </div>
  )
}

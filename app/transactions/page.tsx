'use client'
import { useState } from 'react'
import { StoreProvider, useStore, Transaction } from '@/lib/store'
import { Card, CardHeader, Badge, Tabs, Btn } from '@/components/ui'

type Filter = 'all' | 'out' | 'in' | 'blocked'
const TABS = [
  { key: 'all',     label: 'All' },
  { key: 'out',     label: 'Payments' },
  { key: 'in',      label: 'Income' },
  { key: 'blocked', label: 'Blocked' },
]

function TxRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const isBlocked = tx.status === 'blocked'
  const isIn      = tx.type === 'in'
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '32px 1fr auto auto auto',
      alignItems: 'center', gap: 14, padding: '12px 18px',
      borderBottom: last ? 'none' : '1px solid var(--line)',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0,
        background: isBlocked ? 'var(--rose-dim)' : isIn ? 'var(--emerald-dim)' : 'rgba(255,255,255,0.05)',
        color: isBlocked ? 'var(--rose)' : isIn ? 'var(--emerald)' : 'var(--ink-2)',
      }}>
        {isBlocked ? '⊘' : isIn ? '↓' : '↑'}
      </div>

      {/* Name + agent */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {tx.agentName} · {tx.chain} · {tx.address}
        </div>
      </div>

      {/* Status */}
      <div>
        {tx.status === 'blocked' && <Badge color="rose">blocked</Badge>}
        {tx.status === 'confirmed' && <Badge color="emerald">confirmed</Badge>}
        {tx.status === 'pending'   && <Badge color="amber">pending</Badge>}
      </div>

      {/* Hash */}
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>
        {tx.hash ? tx.hash : '—'}
      </div>

      {/* Amount + time */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500,
          color: isBlocked ? 'var(--ink-3)' : isIn ? 'var(--emerald)' : 'var(--rose)' }}>
          {isBlocked ? '—' : `${isIn ? '+' : '-'}$${tx.amount.toFixed(2)}`}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{tx.timestamp}</div>
      </div>
    </div>
  )
}

function TxContent() {
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
    <div style={{ padding: 24 }} className="animate-fade-up">
      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>TOTAL PAID OUT</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--rose)' }}>-${totalOut.toFixed(2)}</div>
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>TOTAL INCOME</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>+${totalIn.toFixed(2)}</div>
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>BLOCKED TXS</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--rose)' }}>{blockedCount}</div>
        </div>
      </div>

      <Card>
        <CardHeader
          left={<><span style={{ fontSize: 14, fontWeight: 600 }}>Transactions</span><span style={{ fontSize: 11, color: 'var(--ink-2)' }}>x402 autonomous payments · all agents</span></>}
          right={<Btn size="sm">Export CSV</Btn>}
        />
        <Tabs tabs={TABS} active={filter} onChange={v => setFilter(v as Filter)} />
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              No transactions in this category
            </div>
          ) : (
            filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} last={i === filtered.length - 1} />)
          )}
        </div>
      </Card>
    </div>
  )
}

export default function TransactionsPage() {
  return <StoreProvider><TxContent /></StoreProvider>
}

'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useStore, MarketplaceTemplate, accentColor } from '@/lib/store'
import Link from 'next/link'
import { Search, SlidersHorizontal, Star } from 'lucide-react'
import { StaticFallback } from '@/components/agents/OrbFallback'

const OrbIcon = dynamic(() => import('@/components/agents/OrbIcon'), {
  ssr: false,
  loading: () => <StaticFallback color="var(--ink3)" />,
})

const CATEGORIES = ['All', 'Finance', 'Shopping', 'Research', 'Travel', 'Dev tools']

function AgentCard({ tpl }: { tpl: MarketplaceTemplate }) {
  const isFree = tpl.price === 'Free'
  const accent = accentColor(tpl.color)
  return (
    <Link href={`/marketplace/${tpl.id}`} className="mkt-card" style={{ textDecoration: 'none', display: 'block' }}>
      <div className="mkt-card-top">
        <div className="mkt-icon" style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}14)` }}><OrbIcon color={accent} /></div>
        <span className={`price-tag ${isFree ? 'price-free' : 'price-paid'}`}>{tpl.price}</span>
      </div>
      <div className="mkt-name">{tpl.name}</div>
      <div className="mkt-desc">{tpl.description}</div>
      <div className="mkt-meta">
        <span className="mkt-rating"><Star size={11} fill="currentColor" style={{ marginRight: 3 }} />{tpl.rating}</span>
        <span className="mkt-uses">{(tpl.hiredCount / 1000).toFixed(1)}k hired</span>
        <span className="mkt-cat">{tpl.category}</span>
      </div>
      <div className="view-details">View details →</div>
    </Link>
  )
}

function CustomCard() {
  return (
    <Link href="/create" style={{ textDecoration: 'none' }}>
      <div className="mkt-card" style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 8 }}>
        <div style={{ fontSize: 28, color: 'var(--ink3)' }}>+</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>Build your own</div>
        <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Custom agent</div>
      </div>
    </Link>
  )
}

export default function MarketplacePage() {
  const { marketplace } = useStore()
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')

  const templates = marketplace.length > 0 ? marketplace : []

  const filtered = templates.filter(t =>
    (cat === 'All' || t.category === cat) &&
    (search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="animate-up gap-pad">
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
          BotMart
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Hire autonomous AI agents with real crypto wallets.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: 16, color: 'var(--ink3)' }} />
          <input
            style={{ width: '100%', height: 44, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 14, paddingLeft: 42, paddingRight: 16, fontSize: 13.5, color: 'var(--ink)', fontFamily: 'var(--font)', outline: 'none' }}
            placeholder="Search agents by name, capability, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-ghost" style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={13} /> Filter
        </button>
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 26, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink3)', fontSize: 13 }}>
          Loading BotMart… (make sure the backend is running on port 8000)
        </div>
      ) : (
        <div className="mkt-grid stagger">
          {filtered.map(tpl => (
            <AgentCard key={tpl.id} tpl={tpl} />
          ))}
          <CustomCard />
        </div>
      )}
    </div>
  )
}

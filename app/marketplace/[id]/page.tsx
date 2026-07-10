'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { describeAction } from '@/lib/action-descriptions'
import { getSampleActivity, getReviews } from '@/lib/template-content'
import { HireModal } from '@/components/marketplace/HireModal'

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { marketplace, loading } = useStore()
  const [hiring, setHiring] = useState(false)
  const tpl = marketplace.find(t => t.id === id)

  if (!tpl) {
    return (
      <div className="animate-up gap-pad" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🦅</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
          {loading ? 'Loading…' : 'Agent template not found'}
        </div>
        {!loading && <Link href="/marketplace" className="btn-ghost">← Back to marketplace</Link>}
      </div>
    )
  }

  const isFree = tpl.price === 'Free'
  const activity = getSampleActivity(tpl.category)
  const reviews = getReviews(tpl.category)

  return (
    <div className="animate-up gap-pad" style={{ maxWidth: 760 }}>
      {hiring && <HireModal tpl={tpl} onClose={() => setHiring(false)} />}

      <Link href="/marketplace" style={{ fontSize: 12, color: 'var(--ink3)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Back to marketplace
      </Link>

      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, var(--red), transparent)` }} />
        <div className="card-pad">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {tpl.emoji}
              </div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{tpl.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11.5, color: 'var(--ink3)' }}>
                  <span>★ {tpl.rating}</span>
                  <span>·</span>
                  <span>{(tpl.hiredCount / 1000).toFixed(1)}k hired</span>
                  <span>·</span>
                  <span className="mkt-cat" style={{ marginLeft: 0 }}>{tpl.category}</span>
                </div>
              </div>
            </div>
            <span className={`price-tag ${isFree ? 'price-free' : 'price-paid'}`} style={{ flexShrink: 0 }}>{tpl.price}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, marginBottom: 18 }}>{tpl.description}</div>
          <button className="btn-primary-lg" style={{ width: '100%' }} onClick={() => setHiring(true)}>
            Hire {tpl.name} →
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Capabilities */}
        <div className="card card-pad">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Capabilities</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 14 }}>
            Daily limit <strong style={{ color: 'var(--ink2)' }}>${tpl.defaultDailyLimit}</strong> · Per-tx cap <strong style={{ color: 'var(--ink2)' }}>${tpl.defaultPerTxLimit}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tpl.defaultActions.map(a => (
              <div key={a} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span className="action-tag on" style={{ cursor: 'default', flexShrink: 0 }}>{a}</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink2)', lineHeight: 1.5 }}>{describeAction(a)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sample activity */}
        <div className="card card-pad">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Example agent activity</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginBottom: 14 }}>Illustrative — your hired agent's real activity appears on its own page.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--ink)' }}>{a.label}</span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{a.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>What people are saying</div>
        <div className="detail-grid">
          {reviews.map((r, i) => (
            <div key={i} style={{ background: 'var(--card2)', borderRadius: 10, padding: 14 }}>
              <div style={{ color: 'var(--yellow)', fontSize: 12, marginBottom: 8 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.55, marginBottom: 10 }}>&ldquo;{r.quote}&rdquo;</div>
              <div style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{r.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

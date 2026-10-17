/** Shared x407 icon mark — the brand card (chip + tap-to-pay arcs) on a dark
 * rounded badge, used in the sidebar, landing nav, and footer. The badge stays
 * near-black in both themes so the lime line art always has contrast; the soft
 * glow pulse echoes the hero's "Core" orb (components/brand/CoreOrb.tsx) at a
 * scale where an actual WebGL orb would be wasteful. The favicon uses the
 * sibling X-arrows glyph (public/brand/favicon-64.png) — a deliberate two-mark
 * system: card = primary logo, X = tiny-size glyph. */
export function X407Mark({ size = 24 }: { size?: number; iconSize?: number }) {
  return (
    <div className="x407-mark-glow" style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0C0F06', border: '1px solid rgba(200,245,66,0.35)',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-card-double-arc.png" alt="x407"
        style={{ width: '74%', height: '74%', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}

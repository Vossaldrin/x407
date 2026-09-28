import { Terminal } from 'lucide-react'

/** Shared x407 icon mark — neon-on-dark badge, used in the sidebar, landing nav, and footer.
 * The soft glow pulse echoes the hero's "Core" orb (components/brand/CoreOrb.tsx) at a scale
 * where an actual WebGL orb would be wasteful — same identity, different weight class. */
export function X407Mark({ size = 24, iconSize }: { size?: number; iconSize?: number }) {
  return (
    <div className="x407-mark-glow" style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--neon), var(--neon-hover))',
    }}>
      <Terminal size={iconSize ?? Math.round(size * 0.5)} color="#04140A" strokeWidth={2.5} />
    </div>
  )
}

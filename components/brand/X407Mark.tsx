import { Terminal } from 'lucide-react'

/** Shared x407 icon mark — neon-on-dark badge, used in the sidebar, landing nav, and footer. */
export function X407Mark({ size = 24, iconSize }: { size?: number; iconSize?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--neon), var(--neon-hover))',
    }}>
      <Terminal size={iconSize ?? Math.round(size * 0.5)} color="#04140A" strokeWidth={2.5} />
    </div>
  )
}

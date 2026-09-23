'use client'
// Split out from AgentOrb.tsx so page.tsx can statically import this without
// dragging @react-three/fiber into server/SSR module evaluation — that import
// must stay behind AgentOrb's dynamic(..., { ssr: false }) boundary only.
export function StaticFallback({ color }: { color: string }) {
  return (
    <div
      style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${color}, transparent 70%)`,
        opacity: 0.7,
      }}
    />
  )
}

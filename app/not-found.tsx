import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>404 · NOT FOUND</div>
      <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ink3)', letterSpacing: '-3px' }}>⬡</div>
      <div style={{ fontSize: 15, color: 'var(--ink2)' }}>This page doesn't exist</div>
      <Link href="/marketplace" className="btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
        Back to marketplace
      </Link>
    </div>
  )
}

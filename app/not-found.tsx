import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>404 · NOT FOUND</div>
      <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', letterSpacing: '-3px' }}>⬡</div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)' }}>This page doesn't exist</div>
      <Link href="/" style={{ textDecoration: 'none', marginTop: 8 }}>
        <button style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--iris)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontSize: 13, cursor: 'pointer' }}>
          Back to Overview
        </button>
      </Link>
    </div>
  )
}

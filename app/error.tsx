'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'var(--font-mono)' }}>RUNTIME ERROR</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', background: 'var(--rose-dim)', padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(240,80,112,0.2)' }}>
        {error.message || 'Something went wrong'}
      </div>
      <button onClick={reset} style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--iris)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontSize: 13, cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}

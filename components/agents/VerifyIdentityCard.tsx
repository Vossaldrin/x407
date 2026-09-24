'use client'
import { useState } from 'react'
import { Agent, useStore } from '@/lib/store'
import { verifyAgentIdentity } from '@/lib/agent-identity'
import { ShieldCheck } from 'lucide-react'

/** Real EIP-712 identity verification — the client-side half of the HTTP 407
 * trust layer (backend/trust.py). Same key-handling posture as payments:
 * the private key is used once, locally, to sign, and never sent anywhere. */
export function VerifyIdentityCard({ agent }: { agent: Agent }) {
  const { updateAgent } = useStore()
  const [open, setOpen] = useState(false)
  const [privKey, setPrivKey] = useState('')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')

  const verify = async () => {
    setSigning(true)
    setError('')
    const result = await verifyAgentIdentity(privKey, agent)
    setPrivKey('')
    setSigning(false)
    if (!result.ok) {
      setError(result.error || 'Verification failed')
      return
    }
    updateAgent(agent.id, { identityVerified: true, trustGrade: (result.trustGrade as Agent['trustGrade']) || 'verified' })
    setOpen(false)
  }

  if (agent.identityVerified) return null

  return (
    <div className="card card-pad" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <ShieldCheck size={16} color="var(--ink3)" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Identity unverified</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink3)', lineHeight: 1.5, marginBottom: open ? 12 : 0 }}>
          Payments over $10 need this agent to prove it controls its own wallet first — a real
          HTTP 407 challenge, not a formality. It signs one EIP-712 message locally; nothing is
          sent to us but the signature.
        </div>

        {!open && (
          <button className="btn-ghost" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>Verify identity</button>
        )}

        {open && (
          <>
            <input
              className="field-input" style={{ marginBottom: 8 }}
              type="password" placeholder="Agent private key — 0x…"
              value={privKey} onChange={e => setPrivKey(e.target.value)}
            />
            {error && <div style={{ fontSize: 11, color: 'var(--rose)', marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setOpen(false); setError(''); setPrivKey('') }}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={verify} disabled={!privKey || signing}>
                {signing ? 'Signing…' : 'Sign & verify →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

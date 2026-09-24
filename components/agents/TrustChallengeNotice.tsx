'use client'
import { TrustChallenge } from '@/lib/store'
import { ShieldAlert } from 'lucide-react'

/** Real HTTP 407 challenge, rendered as an actionable notice instead of a
 * generic error string. The actual verify action lives on the agent's
 * header (app/agents/[id]/page.tsx) — this just points there. */
export function TrustChallengeNotice({ challenge }: { challenge: TrustChallenge }) {
  return (
    <div style={{
      background: 'var(--yellow-dim)', border: '0.5px solid var(--yellow)', borderRadius: 12,
      padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <ShieldAlert size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
          HTTP 407 — identity verification required
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink2)', lineHeight: 1.5 }}>
          {challenge.reason} Use "Verify identity" above, on this agent's card, then try again.
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { Agent } from '@/lib/store'
import { PaymentConfirmModal } from '@/components/ui/PaymentConfirmModal'

/** Generic "pay for API/compute access" flow — real on-chain USDC payment via x407 (built on x402/HTTP 402 semantics). */
export function ApiPaymentFlow({ agent, initialResourceUrl }: { agent: Agent; initialResourceUrl?: string }) {
  const [payResource, setPayResource] = useState<string | null>(initialResourceUrl !== undefined ? (initialResourceUrl || '') : null)

  const start = () => {
    const url = window.prompt(
      'Resource URL to pay for (leave blank to use the built-in demo compute API):', ''
    )
    if (url === null) return // cancelled
    setPayResource(url.trim() || '')
  }

  return (
    <div className="card card-pad">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Pay for API access</div>
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.5 }}>
        This agent can pay any x402-compatible endpoint directly from its own wallet — real USDC on
        Base, quoted and confirmed before anything is sent.
      </div>
      <button className="btn-primary-lg" style={{ width: '100%' }} onClick={start}>
        Pay for API →
      </button>

      {payResource !== null && (
        <PaymentConfirmModal
          agentId={agent.id}
          resourceUrl={payResource || undefined}
          onClose={() => setPayResource(null)}
        />
      )}
    </div>
  )
}

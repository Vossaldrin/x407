'use client'
// EIP-712 identity verification for the real HTTP 407 trust layer (backend/trust.py).
// Same posture as x407-agent-pay.ts: the private key is supplied for a single
// client-side signature and never sent to our backend — only the resulting
// signature is. This shape (domain/types/value) must exactly match trust.py's
// EIP712_DOMAIN/EIP712_TYPES/identity_message or the backend won't recover
// the right signer.

import { ethers } from 'ethers'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface VerifyIdentityResult {
  ok: boolean
  trustGrade?: string
  error?: string
}

export async function verifyAgentIdentity(
  privateKeyHex: string,
  agent: { id: string; fullAddr: string; createdAt: string },
): Promise<VerifyIdentityResult> {
  try {
    const wallet = new ethers.Wallet(privateKeyHex)
    if (wallet.address.toLowerCase() !== agent.fullAddr.toLowerCase()) {
      return { ok: false, error: "That private key doesn't match this agent's wallet address." }
    }

    const domain = { name: 'x407', version: '1' }
    const types = {
      AgentIdentity: [
        { name: 'agentId', type: 'string' },
        { name: 'wallet', type: 'address' },
        { name: 'issuedAt', type: 'string' },
      ],
    }
    const value = { agentId: agent.id, wallet: agent.fullAddr, issuedAt: agent.createdAt }
    const signature = await wallet.signTypedData(domain, types, value)

    const res = await fetch(`${API}/agents/${agent.id}/verify-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.detail || 'Verification failed' }
    }
    const data = await res.json()
    return { ok: true, trustGrade: data.trustGrade }
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || 'Signing failed' }
  }
}

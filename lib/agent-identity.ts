'use client'
// EIP-712 identity verification + action authorization for x407 (backend/
// trust.py and backend/auth.py). Same posture throughout: the private key is
// supplied for a single client-side signature and never sent to our backend
// — only the resulting signature is. Shapes here must exactly match the
// backend's EIP712_DOMAIN/EIP712_TYPES or it won't recover the right signer.

import { ethers } from 'ethers'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface SignedAction {
  signature: string
  nonce: string
  timestamp: number
}

/** Signs a fresh, single-use authorization for one specific action on one
 * agent — proves the caller holds that agent's key right now, not just that
 * they captured a signature once. Required by PATCH/DELETE/verify-identity. */
export async function signAgentAction(privateKeyHex: string, agentId: string, action: string): Promise<SignedAction> {
  const wallet = new ethers.Wallet(privateKeyHex)
  const domain = { name: 'x407', version: '1' }
  const types = {
    AgentAction: [
      { name: 'agentId', type: 'string' },
      { name: 'action', type: 'string' },
      { name: 'nonce', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
  }
  const nonce = crypto.randomUUID()
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await wallet.signTypedData(domain, types, { agentId, action, nonce, timestamp })
  return { signature, nonce, timestamp }
}

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
    const auth = await signAgentAction(privateKeyHex, agent.id, 'verify-identity')

    const res = await fetch(`${API}/agents/${agent.id}/verify-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, auth }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: typeof body.detail === 'string' ? body.detail : 'Verification failed' }
    }
    const data = await res.json()
    return { ok: true, trustGrade: data.trustGrade }
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || 'Signing failed' }
  }
}

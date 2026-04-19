import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { agentId, recipient, amount, description, chain } = await req.json()

  if (!agentId || !amount) {
    return NextResponse.json({ error: 'agentId and amount required' }, { status: 400 })
  }

  // TODO: wire to real x402 payment logic
  // const result = await x402Pay({ agentId, recipient, amount, chain })

  const tx = {
    id: `tx_${Date.now()}`,
    name: description || 'API Payment',
    agentId,
    type: 'out',
    amount,
    chain: chain || 'Base',
    address: recipient || '0x0000…0000',
    timestamp: 'just now',
    status: 'confirmed',
    hash: '0x' + Math.random().toString(16).slice(2, 10),
  }

  return NextResponse.json({ ok: true, transaction: tx }, { status: 201 })
}

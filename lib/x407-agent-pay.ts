'use client'
// Agent-side payment signer for the x407 flow (real HTTP 402 semantics underneath).
// The agent's private key is supplied by the user for a single call and is
// never sent to our backend — it only ever signs/broadcasts locally here.

import { ethers } from 'ethers'

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
]

export interface AgentPayResult {
  ok: boolean
  hash?: string
  error?: string
}

/** Signs and broadcasts a real USDC transfer from the agent's own wallet on Base. */
export async function payWithAgentWallet(
  privateKeyHex: string,
  payToAddress: string,
  usdcAmount: number,
  rpcUrl: string = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
): Promise<AgentPayResult> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKeyHex, provider)
    const usdc = new ethers.Contract(USDC_BASE, ERC20_ABI, wallet)

    const amountUnits = ethers.parseUnits(usdcAmount.toString(), USDC_DECIMALS)
    const balance: bigint = await usdc.balanceOf(wallet.address)
    if (balance < amountUnits) {
      return { ok: false, error: `Agent wallet has insufficient USDC (has ${ethers.formatUnits(balance, USDC_DECIMALS)}, needs ${usdcAmount})` }
    }

    const tx = await usdc.transfer(payToAddress, amountUnits)
    await tx.wait(1)
    return { ok: true, hash: tx.hash }
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || 'Transaction failed' }
  }
}

export function agentAddressFromKey(privateKeyHex: string): string | null {
  try {
    return new ethers.Wallet(privateKeyHex).address
  } catch {
    return null
  }
}

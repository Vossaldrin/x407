'use client'
// Real Uniswap V3 swap execution, ETH<->USDC on Base — client-side signing only.
// Same non-custodial pattern as lib/x402-agent-pay.ts: the agent's private key
// signs both the approve (if needed) and swap transactions locally.

import { ethers } from 'ethers'

const SWAP_ROUTER02 = '0x2626664c2603336E57B271c5C0b26F421741e481'
const WETH9 = '0x4200000000000000000000000000000000000006'
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const TOKENS: Record<string, string> = { ETH: WETH9, USDC: USDC }
const DECIMALS: Record<string, number> = { ETH: 18, USDC: 6 }

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]
const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)',
]

export interface SwapResult {
  ok: boolean
  hash?: string
  error?: string
}

/** Signs and broadcasts a real ETH<->USDC swap via Uniswap V3 SwapRouter02 on Base. */
export async function executeSwap(
  privateKeyHex: string,
  fromToken: 'ETH' | 'USDC',
  toToken: 'ETH' | 'USDC',
  amountIn: number,
  fee: number,
  minAmountOut: number,
  rpcUrl: string = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
): Promise<SwapResult> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKeyHex, provider)

    const tokenInAddr = TOKENS[fromToken]
    const tokenOutAddr = TOKENS[toToken]
    const amountInUnits = ethers.parseUnits(amountIn.toString(), DECIMALS[fromToken])
    const minOutUnits = ethers.parseUnits(minAmountOut.toString(), DECIMALS[toToken])

    const tokenIn = new ethers.Contract(tokenInAddr, ERC20_ABI, wallet)
    const allowance: bigint = await tokenIn.allowance(wallet.address, SWAP_ROUTER02)
    if (allowance < amountInUnits) {
      const approveTx = await tokenIn.approve(SWAP_ROUTER02, amountInUnits)
      await approveTx.wait(1)
    }

    const router = new ethers.Contract(SWAP_ROUTER02, ROUTER_ABI, wallet)
    const swapTx = await router.exactInputSingle({
      tokenIn: tokenInAddr,
      tokenOut: tokenOutAddr,
      fee,
      recipient: wallet.address,
      amountIn: amountInUnits,
      amountOutMinimum: minOutUnits,
      sqrtPriceLimitX96: 0,
    })
    await swapTx.wait(1)
    return { ok: true, hash: swapTx.hash }
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || 'Swap failed' }
  }
}

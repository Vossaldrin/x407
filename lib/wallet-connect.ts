'use client'
// Minimal MetaMask connection + native-token send helper.
// No extra packages needed — uses window.ethereum directly (EIP-1193).

declare global {
  interface Window { ethereum?: any }
}

export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum
}

export async function connectWallet(): Promise<string | null> {
  if (!hasMetaMask()) return null
  try {
    const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return accounts[0] ?? null
  } catch {
    return null
  }
}

const CHAIN_IDS: Record<string, string> = {
  Base:     '0x2105', // 8453
  Ethereum: '0x1',
  Arbitrum: '0xa4b1',
}

export async function ensureChain(chain: string): Promise<boolean> {
  if (!hasMetaMask()) return false
  const chainId = CHAIN_IDS[chain]
  if (!chainId) return true
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
    return true
  } catch {
    return false // user rejected or chain not added
  }
}

/** Send native ETH from the connected MetaMask account to an agent's address. */
export async function sendFunds(toAddress: string, amountEth: string, chain: string): Promise<{ ok: boolean; hash?: string; error?: string }> {
  if (!hasMetaMask()) return { ok: false, error: 'MetaMask not detected' }
  const from = await connectWallet()
  if (!from) return { ok: false, error: 'Wallet connection rejected' }

  await ensureChain(chain)

  try {
    // Convert ETH string to wei hex
    const wei = BigInt(Math.round(parseFloat(amountEth) * 1e18))
    const hash: string = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: toAddress, value: '0x' + wei.toString(16) }],
    })
    return { ok: true, hash }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Transaction rejected' }
  }
}

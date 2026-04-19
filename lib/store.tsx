'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type Chain = 'Base' | 'Ethereum' | 'Arbitrum' | 'Optimism' | 'Polygon'
export type AgentStatus = 'active' | 'idle' | 'expired' | 'paused'

export interface Agent {
  id: string
  name: string
  shortAddr: string
  fullAddr: string
  chain: Chain
  dailyLimit: number
  perTxLimit: number
  spentToday: number
  balance: number
  status: AgentStatus
  allowedActions: string[]
  expiry: string
  ownerWallet?: string
  initials: string
  color: 'iris' | 'emerald' | 'amber' | 'rose'
  createdAt: string
  txCount: number
}

export interface Transaction {
  id: string
  name: string
  agentId: string
  agentName: string
  type: 'out' | 'in'
  amount: number
  chain: Chain
  address: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'blocked'
  hash?: string
}

export interface Token {
  symbol: string
  name: string
  amount: number
  usdValue: number
  chains: Chain[]
  icon: string
  change24h: number
}

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_AGENTS: Agent[] = [
  {
    id: 'ag_01', name: 'DataFetcher Alpha', shortAddr: '0x4f3a…9b2c',
    fullAddr: '0x4f3a8c2d1e9f7b6a3c5d8e1f2a4b7c9d0e3f2b9c',
    chain: 'Base', dailyLimit: 500, perTxLimit: 50, spentToday: 142,
    balance: 250, status: 'active',
    allowedActions: ['pay_api', 'fetch_data', 'buy_compute'],
    expiry: '2025-12-31', initials: 'DA', color: 'iris',
    createdAt: '2024-11-01', txCount: 148,
  },
  {
    id: 'ag_02', name: 'TradeBot v2', shortAddr: '0x8c11…de4f',
    fullAddr: '0x8c11f3a2d9e7b6c4a5d8e1f2a4b7c9d0e3f2bde4',
    chain: 'Arbitrum', dailyLimit: 2000, perTxLimit: 200, spentToday: 830,
    balance: 1200, status: 'active',
    allowedActions: ['trade', 'pay_api', 'fetch_data', 'swap'],
    expiry: '2026-03-15', initials: 'TB', color: 'emerald',
    createdAt: '2024-10-15', txCount: 412,
  },
  {
    id: 'ag_03', name: 'APIBroker Pro', shortAddr: '0x77f2…cc8a',
    fullAddr: '0x77f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8ecc8',
    chain: 'Ethereum', dailyLimit: 300, perTxLimit: 30, spentToday: 0,
    balance: 89.4, status: 'idle',
    allowedActions: ['pay_api', 'broker_data'],
    expiry: '2025-11-01', initials: 'AB', color: 'amber',
    createdAt: '2024-09-20', txCount: 67,
  },
  {
    id: 'ag_04', name: 'ScannerBot', shortAddr: '0x3b9e…12fa',
    fullAddr: '0x3b9e4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f012f',
    chain: 'Base', dailyLimit: 100, perTxLimit: 10, spentToday: 0,
    balance: 0, status: 'expired',
    allowedActions: ['scan', 'fetch_data'],
    expiry: '2024-12-01', initials: 'SC', color: 'rose',
    createdAt: '2024-08-01', txCount: 23,
  },
]

const SEED_TXS: Transaction[] = [
  { id: 'tx_01', name: 'OpenAI GPT-4 API',    agentId: 'ag_01', agentName: 'DataFetcher Alpha', type: 'out', amount: 4.20,  chain: 'Base',     address: '0x4f3a…9b2c', timestamp: '2m ago',  status: 'confirmed', hash: '0xabc1' },
  { id: 'tx_02', name: 'Serper Search API',   agentId: 'ag_02', agentName: 'TradeBot v2',       type: 'out', amount: 0.50,  chain: 'Arbitrum', address: '0x8c11…de4f', timestamp: '18m ago', status: 'confirmed', hash: '0xabc2' },
  { id: 'tx_03', name: 'Arbitrage Reward',    agentId: 'ag_02', agentName: 'TradeBot v2',       type: 'in',  amount: 12.00, chain: 'Arbitrum', address: '0x8c11…de4f', timestamp: '1h ago',  status: 'confirmed', hash: '0xabc3' },
  { id: 'tx_04', name: 'Infura RPC',          agentId: 'ag_01', agentName: 'DataFetcher Alpha', type: 'out', amount: 1.80,  chain: 'Ethereum', address: '0x4f3a…9b2c', timestamp: '3h ago',  status: 'confirmed', hash: '0xabc4' },
  { id: 'tx_05', name: 'Anthropic API',       agentId: 'ag_03', agentName: 'APIBroker Pro',     type: 'out', amount: 8.40,  chain: 'Ethereum', address: '0x77f2…cc8a', timestamp: '5h ago',  status: 'confirmed', hash: '0xabc5' },
  { id: 'tx_06', name: 'Data Sale Revenue',   agentId: 'ag_01', agentName: 'DataFetcher Alpha', type: 'in',  amount: 25.00, chain: 'Base',     address: '0x4f3a…9b2c', timestamp: '8h ago',  status: 'confirmed', hash: '0xabc6' },
  { id: 'tx_07', name: 'Daily Limit Breach',  agentId: 'ag_04', agentName: 'ScannerBot',        type: 'out', amount: 0,     chain: 'Base',     address: '0x3b9e…12fa', timestamp: '12h ago', status: 'blocked'   },
  { id: 'tx_08', name: 'Coingecko Price API', agentId: 'ag_02', agentName: 'TradeBot v2',       type: 'out', amount: 0.10,  chain: 'Arbitrum', address: '0x8c11…de4f', timestamp: '14h ago', status: 'confirmed', hash: '0xabc8' },
]

const SEED_TOKENS: Token[] = [
  { symbol: 'ETH',  name: 'Ethereum', amount: 1.842,   usdValue: 6210.40, chains: ['Base','Arbitrum','Ethereum'], icon: 'Ξ', change24h: +2.4  },
  { symbol: 'USDC', name: 'USDC',     amount: 2400.00, usdValue: 2400.00, chains: ['Base','Ethereum'],           icon: '$', change24h: +0.01 },
  { symbol: 'USDT', name: 'USDT',     amount: 841.20,  usdValue: 841.20,  chains: ['Arbitrum'],                  icon: '₮', change24h: -0.02 },
]

// ── Context ───────────────────────────────────────────────────────────────────

interface Store {
  agents: Agent[]
  transactions: Transaction[]
  tokens: Token[]
  addAgent: (a: Agent) => void
  updateAgent: (id: string, patch: Partial<Agent>) => void
}

const Ctx = createContext<Store>({
  agents: SEED_AGENTS, transactions: SEED_TXS, tokens: SEED_TOKENS,
  addAgent: () => {}, updateAgent: () => {},
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents]           = useState<Agent[]>(SEED_AGENTS)
  const [transactions]                = useState<Transaction[]>(SEED_TXS)
  const [tokens]                      = useState<Token[]>(SEED_TOKENS)

  const addAgent    = useCallback((a: Agent) => setAgents(p => [a, ...p]), [])
  const updateAgent = useCallback((id: string, patch: Partial<Agent>) =>
    setAgents(p => p.map(a => a.id === id ? { ...a, ...patch } : a)), [])

  return <Ctx.Provider value={{ agents, transactions, tokens, addAgent, updateAgent }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

// ── Helpers ───────────────────────────────────────────────────────────────────

export function genAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
}

export function shortAddr(addr: string): string {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

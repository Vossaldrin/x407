'use client'
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Types ─────────────────────────────────────────────────────────────────────
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
  color: 'emerald' | 'amber' | 'iris' | 'rose' | 'blue' | 'grey'
  createdAt: string
  txCount: number
  templateId?: string
  emoji?: string
  category?: string
  customRules?: string
  identityVerified?: boolean
  trustGrade?: 'unverified' | 'verified' | 'established' | 'trusted'
}

export interface TrustChallenge {
  x407TrustVersion: number
  trustRequired: string
  trustCurrent: string
  reason: string
  verify: { endpoint: string; method: string }
}

export interface Transaction {
  id: string
  name: string
  agentId: string
  agentName: string
  type: 'out' | 'in'
  amount: number
  chain: string
  address: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'blocked'
  hash?: string | null
  reason?: string
  real?: boolean
}

export interface PaymentQuote {
  agent: Agent
  resourceUrl: string
  quote: {
    scheme: string
    network: string
    amount: string
    asset: string
    payTo: string
    resource: string
    description: string
    maxTimeoutSeconds: number
  }
}

export interface Token {
  symbol: string
  name: string
  amount: number
  usdValue: number
  chains: string[]
  change24h: number
}

export interface MarketplaceTemplate {
  id: string
  name: string
  emoji: string
  category: string
  description: string
  price: string
  rating: number
  hiredCount: number
  defaultActions: string[]
  defaultDailyLimit: number
  defaultPerTxLimit: number
  color: string
  featured: boolean
}

// ── Seed data (shown while backend loads / offline) ───────────────────────────
const SEED_AGENTS: Agent[] = [
  {
    id: 'ag_01', name: 'DeFi Trader', shortAddr: '0x4f3a…9b2c',
    fullAddr: '0x4f3a8c2d1e9f7b6a3c5d8e1f2a4b7c9d0e3f2b9c',
    chain: 'Base', dailyLimit: 500, perTxLimit: 100, spentToday: 200,
    balance: 850, status: 'active', allowedActions: ['trade','swap','fetch_data','pay_api'],
    expiry: '2026-12-31', initials: 'DT', color: 'emerald',
    createdAt: '2025-01-10', txCount: 148, emoji: '📈', category: 'Finance',
  },
  {
    id: 'ag_02', name: 'Grocery Scout', shortAddr: '0x8c11…de4f',
    fullAddr: '0x8c11f3a2d9e7b6c4a5d8e1f2a4b7c9d0e3f2bde4',
    chain: 'Ethereum', dailyLimit: 150, perTxLimit: 50, spentToday: 108,
    balance: 220, status: 'active', allowedActions: ['shop','pay_api','fetch_data'],
    expiry: '2026-12-31', initials: 'GS', color: 'amber',
    createdAt: '2025-01-15', txCount: 412, emoji: '🛒', category: 'Shopping',
  },
  {
    id: 'ag_03', name: 'Budget Guard', shortAddr: '0x77f2…cc8a',
    fullAddr: '0x77f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8ecc8',
    chain: 'Arbitrum', dailyLimit: 200, perTxLimit: 50, spentToday: 0,
    balance: 180, status: 'idle', allowedActions: ['pay_api','fetch_data','cancel_subscription'],
    expiry: '2026-12-31', initials: 'BG', color: 'iris',
    createdAt: '2025-02-01', txCount: 67, emoji: '💰', category: 'Finance',
  },
]

const SEED_TXS: Transaction[] = [
  { id: 'tx_01', name: 'Uniswap ETH → USDC', agentId: 'ag_01', agentName: 'DeFi Trader', type: 'out', amount: 120, chain: 'Base', address: '0x4f3a…9b2c', timestamp: '2m ago', status: 'confirmed', hash: '0xabc1' },
  { id: 'tx_02', name: 'Tesco weekly shop', agentId: 'ag_02', agentName: 'Grocery Scout', type: 'out', amount: 72.4, chain: 'Ethereum', address: '0x8c11…de4f', timestamp: '1h ago', status: 'confirmed', hash: '0xabc2' },
  { id: 'tx_03', name: 'Arbitrage reward', agentId: 'ag_01', agentName: 'DeFi Trader', type: 'in', amount: 18.5, chain: 'Base', address: '0x4f3a…9b2c', timestamp: '3h ago', status: 'confirmed', hash: '0xabc3' },
  { id: 'tx_04', name: 'Daily limit exceeded', agentId: 'ag_02', agentName: 'Grocery Scout', type: 'out', amount: 0, chain: 'Ethereum', address: '0x8c11…de4f', timestamp: '5h ago', status: 'blocked' },
  { id: 'tx_05', name: 'Coingecko API', agentId: 'ag_01', agentName: 'DeFi Trader', type: 'out', amount: 0.10, chain: 'Base', address: '0x4f3a…9b2c', timestamp: '8h ago', status: 'confirmed', hash: '0xabc5' },
]

const SEED_TOKENS: Token[] = [
  { symbol: 'ETH',  name: 'Ethereum', amount: 1.842,   usdValue: 6210.40, chains: ['Base','Arbitrum','Ethereum'], change24h: 2.4 },
  { symbol: 'USDC', name: 'USDC',     amount: 2400.00, usdValue: 2400.00, chains: ['Base','Ethereum'],            change24h: 0.01 },
  { symbol: 'USDT', name: 'USDT',     amount: 841.20,  usdValue: 841.20,  chains: ['Arbitrum'],                   change24h: -0.02 },
]

// ── Context ───────────────────────────────────────────────────────────────────
interface Store {
  agents: Agent[]
  transactions: Transaction[]
  tokens: Token[]
  marketplace: MarketplaceTemplate[]
  loading: boolean
  addAgent: (a: Agent) => void
  updateAgent: (id: string, patch: Partial<Agent>) => void
  refreshAgents: () => Promise<void>
  refreshTransactions: () => Promise<void>
  hireAgent: (templateId: string, chain: string, expiry: string, overrides?: { dailyLimit?: number; perTxLimit?: number; actions?: string[] }) => Promise<{ agent: Agent; privateKey: string } | null>
  createAgent: (body: object) => Promise<{ agent: Agent; privateKey: string } | null>
  quotePayment: (agentId: string, resourceUrl?: string) => Promise<PaymentQuote | { trustChallenge: TrustChallenge } | null>
  executePayment: (agentId: string, resourceUrl: string, txHash: string) => Promise<{ ok: boolean; transaction?: Transaction; resource?: any; error?: string }>
  simulatePayment: (agentId: string, recipient: string, amount: number, description: string) => Promise<{ ok: boolean; transaction?: Transaction; error?: string }>
}

const Ctx = createContext<Store>({
  agents: SEED_AGENTS, transactions: SEED_TXS, tokens: SEED_TOKENS,
  marketplace: [], loading: false,
  addAgent: () => {}, updateAgent: () => {},
  refreshAgents: async () => {}, refreshTransactions: async () => {},
  hireAgent: async () => null, createAgent: async () => null,
  quotePayment: async () => null, executePayment: async () => ({ ok: false, error: 'not initialized' }),
  simulatePayment: async () => ({ ok: false, error: 'not initialized' }),
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents]           = useState<Agent[]>(SEED_AGENTS)
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TXS)
  const [tokens]                      = useState<Token[]>(SEED_TOKENS)
  const [marketplace, setMarketplace] = useState<MarketplaceTemplate[]>([])
  const [loading, setLoading]         = useState(false)

  const refreshAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/agents`)
      if (!res.ok) return
      const data = await res.json()
      setAgents(data.agents || [])
    } catch { /* backend offline — keep seed data */ }
  }, [])

  const refreshTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/transactions`)
      if (!res.ok) return
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch { /* offline */ }
  }, [])

  const loadMarketplace = useCallback(async () => {
    try {
      const res = await fetch(`${API}/marketplace`)
      if (!res.ok) return
      const data = await res.json()
      setMarketplace(data.templates || [])
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([refreshAgents(), refreshTransactions(), loadMarketplace()])
      .finally(() => setLoading(false))
  }, [refreshAgents, refreshTransactions, loadMarketplace])

  const addAgent    = useCallback((a: Agent) => setAgents(p => [a, ...p]), [])
  const updateAgent = useCallback((id: string, patch: Partial<Agent>) =>
    setAgents(p => p.map(a => a.id === id ? { ...a, ...patch } : a)), [])

  const hireAgent = useCallback(async (
    templateId: string, chain: string, expiry: string,
    overrides?: { dailyLimit?: number; perTxLimit?: number; actions?: string[] }
  ) => {
    try {
      const res = await fetch(`${API}/marketplace/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, chain, expiry, ...overrides }),
      })
      if (!res.ok) return null
      const data = await res.json()
      addAgent(data.agent)
      return data
    } catch { return null }
  }, [addAgent])

  const createAgent = useCallback(async (body: object) => {
    try {
      const res = await fetch(`${API}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) return null
      const data = await res.json()
      addAgent(data.agent)
      return data
    } catch { return null }
  }, [addAgent])

  const quotePayment = useCallback(async (agentId: string, resourceUrl?: string) => {
    try {
      const res = await fetch(`${API}/payments/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, resourceUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 407) return { trustChallenge: data.detail as TrustChallenge }
      if (!res.ok) return null
      return data
    } catch { return null }
  }, [])

  const executePayment = useCallback(async (agentId: string, resourceUrl: string, txHash: string) => {
    try {
      const res = await fetch(`${API}/payments/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, resourceUrl, txHash }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: typeof data.detail === 'string' ? data.detail : 'Payment execution failed' }
      if (data.transaction) setTransactions(p => [data.transaction, ...p])
      if (data.transaction) updateAgent(agentId, {
        spentToday: (agents.find(a => a.id === agentId)?.spentToday || 0) + data.transaction.amount,
      })
      return { ok: true, transaction: data.transaction, resource: data.resource }
    } catch {
      return { ok: false, error: 'Backend offline' }
    }
  }, [agents, updateAgent])

  const simulatePayment = useCallback(async (agentId: string, recipient: string, amount: number, description: string) => {
    try {
      const res = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, recipient, amount, description, chain: agents.find(a => a.id === agentId)?.chain || 'Base' }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.detail || 'Payment failed' }
      setTransactions(p => [data.transaction, ...p])
      updateAgent(agentId, { spentToday: (agents.find(a => a.id === agentId)?.spentToday || 0) + amount })
      return { ok: true, transaction: data.transaction }
    } catch {
      return { ok: false, error: 'Backend offline' }
    }
  }, [agents, updateAgent])

  return (
    <Ctx.Provider value={{
      agents, transactions, tokens, marketplace, loading,
      addAgent, updateAgent, refreshAgents, refreshTransactions,
      hireAgent, createAgent, quotePayment, executePayment, simulatePayment,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useStore = () => useContext(Ctx)

// ── Helpers ───────────────────────────────────────────────────────────────────
export function genAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
}
export function shortAddr(addr: string): string {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}
export function accentColor(color: string): string {
  return { emerald: '#4CAF50', amber: '#FFD600', iris: '#7C6DF8', rose: '#F87171', blue: '#4A9EFF', grey: '#9CA3AF' }[color] ?? '#4CAF50'
}

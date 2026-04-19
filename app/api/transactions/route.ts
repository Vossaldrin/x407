import { NextResponse } from 'next/server'

const TXS = [
  { id:'tx_01', name:'OpenAI GPT-4 API',    agentId:'ag_01', agentName:'DataFetcher Alpha', type:'out', amount:4.20,  chain:'Base',     address:'0x4f3a…9b2c', timestamp:'2m ago',  status:'confirmed', hash:'0xabc123' },
  { id:'tx_02', name:'Serper Search API',   agentId:'ag_02', agentName:'TradeBot v2',       type:'out', amount:0.50,  chain:'Arbitrum', address:'0x8c11…de4f', timestamp:'18m ago', status:'confirmed', hash:'0xabc456' },
  { id:'tx_03', name:'Arbitrage Reward',    agentId:'ag_02', agentName:'TradeBot v2',       type:'in',  amount:12.00, chain:'Arbitrum', address:'0x8c11…de4f', timestamp:'1h ago',  status:'confirmed', hash:'0xabc789' },
  { id:'tx_04', name:'Infura RPC',          agentId:'ag_01', agentName:'DataFetcher Alpha', type:'out', amount:1.80,  chain:'Ethereum', address:'0x4f3a…9b2c', timestamp:'3h ago',  status:'confirmed', hash:'0xabcdef' },
  { id:'tx_05', name:'Anthropic API',       agentId:'ag_03', agentName:'APIBroker Pro',     type:'out', amount:8.40,  chain:'Ethereum', address:'0x77f2…cc8a', timestamp:'5h ago',  status:'confirmed', hash:'0xabc111' },
  { id:'tx_06', name:'Data Sale Revenue',   agentId:'ag_01', agentName:'DataFetcher Alpha', type:'in',  amount:25.00, chain:'Base',     address:'0x4f3a…9b2c', timestamp:'8h ago',  status:'confirmed', hash:'0xabc222' },
  { id:'tx_07', name:'Daily Limit Breach',  agentId:'ag_04', agentName:'ScannerBot',        type:'out', amount:0,     chain:'Base',     address:'0x3b9e…12fa', timestamp:'12h ago', status:'blocked',   hash:null },
  { id:'tx_08', name:'Coingecko Price API', agentId:'ag_02', agentName:'TradeBot v2',       type:'out', amount:0.10,  chain:'Arbitrum', address:'0x8c11…de4f', timestamp:'14h ago', status:'confirmed', hash:'0xabc333' },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type    = searchParams.get('type')
  const agentId = searchParams.get('agentId')

  let txs = TXS
  if (type === 'blocked') txs = txs.filter(t => t.status === 'blocked')
  else if (type && type !== 'all') txs = txs.filter(t => t.type === type && t.status !== 'blocked')
  if (agentId) txs = txs.filter(t => t.agentId === agentId)

  return NextResponse.json({ transactions: txs })
}

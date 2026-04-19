import { NextResponse } from 'next/server'

const AGENTS = [
  { id:'ag_01', name:'DataFetcher Alpha', shortAddr:'0x4f3a…9b2c', chain:'Base',     dailyLimit:500,  perTxLimit:50,  spentToday:142, balance:250,   status:'active',  allowedActions:['pay_api','fetch_data','buy_compute'], expiry:'2025-12-31', initials:'DA', color:'iris',    txCount:148 },
  { id:'ag_02', name:'TradeBot v2',       shortAddr:'0x8c11…de4f', chain:'Arbitrum', dailyLimit:2000, perTxLimit:200, spentToday:830, balance:1200,  status:'active',  allowedActions:['trade','pay_api','fetch_data','swap'],  expiry:'2026-03-15', initials:'TB', color:'emerald', txCount:412 },
  { id:'ag_03', name:'APIBroker Pro',     shortAddr:'0x77f2…cc8a', chain:'Ethereum', dailyLimit:300,  perTxLimit:30,  spentToday:0,   balance:89.4,  status:'idle',    allowedActions:['pay_api','broker_data'],               expiry:'2025-11-01', initials:'AB', color:'amber',   txCount:67  },
  { id:'ag_04', name:'ScannerBot',        shortAddr:'0x3b9e…12fa', chain:'Base',     dailyLimit:100,  perTxLimit:10,  spentToday:0,   balance:0,     status:'expired', allowedActions:['scan','fetch_data'],                   expiry:'2024-12-01', initials:'SC', color:'rose',    txCount:23  },
]

export async function GET() {
  // TODO: swap for real backend call
  // const res = await fetch(`${process.env.PYTHON_API}/agents`)
  // return NextResponse.json(await res.json())
  return NextResponse.json({ agents: AGENTS })
}

export async function POST(req: Request) {
  const body = await req.json()
  const addr = '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
  const agent = {
    id: `ag_${Date.now()}`,
    shortAddr: addr.slice(0,6) + '…' + addr.slice(-4),
    fullAddr: addr,
    spentToday: 0, balance: 0,
    status: 'active',
    initials: (body.name as string).split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase(),
    txCount: 0,
    createdAt: new Date().toISOString().slice(0,10),
    ...body,
  }
  return NextResponse.json({ agent }, { status: 201 })
}

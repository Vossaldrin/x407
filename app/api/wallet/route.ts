import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    totalUsd: 9451.60,
    tokens: [
      { symbol:'ETH',  name:'Ethereum', amount:1.842,   usdValue:6210.40, chains:['Base','Arbitrum','Ethereum'], change24h:+2.4  },
      { symbol:'USDC', name:'USDC',     amount:2400.00, usdValue:2400.00, chains:['Base','Ethereum'],            change24h:+0.01 },
      { symbol:'USDT', name:'USDT',     amount:841.20,  usdValue:841.20,  chains:['Arbitrum'],                   change24h:-0.02 },
    ],
    chains: [
      { name:'Base',     pct:48, usd:4536.77 },
      { name:'Arbitrum', pct:30, usd:2835.48 },
      { name:'Ethereum', pct:22, usd:2079.35 },
    ],
  })
}

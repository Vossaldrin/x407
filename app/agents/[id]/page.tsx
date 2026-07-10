'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useStore, Agent, accentColor } from '@/lib/store'
import { ApiPaymentFlow } from '@/components/agents/ApiPaymentFlow'
import { ResearchFlow } from '@/components/agents/ResearchFlow'
import { FinanceFlow } from '@/components/agents/FinanceFlow'
import { TravelFlow } from '@/components/agents/TravelFlow'
import { DefiFlow } from '@/components/agents/DefiFlow'
import { AgentChat } from '@/components/agents/AgentChat'
import { ProposedAction } from '@/lib/agent-chat'

type FlowType = 'research' | 'finance' | 'travel' | 'defi' | 'api' | 'none'

const FLOW_BY_TEMPLATE: Record<string, FlowType> = {
  tpl_research_bot: 'research',
  tpl_budget_guard: 'finance',
  tpl_travel_planner: 'travel',
  tpl_defi_trader: 'defi',
  tpl_investment_agent: 'defi',
  tpl_dev_ops: 'api',
}

function flowFor(agent: Agent): FlowType {
  if (agent.templateId && FLOW_BY_TEMPLATE[agent.templateId]) return FLOW_BY_TEMPLATE[agent.templateId]
  if (agent.allowedActions.includes('pay_api')) return 'api'
  return 'none'
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { agents, loading } = useStore()
  const agent = agents.find(a => a.id === id)
  const [chatProposal, setChatProposal] = useState<ProposedAction | null>(null)

  if (!agent) {
    return (
      <div className="animate-up gap-pad" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🦅</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink2)', marginBottom: 6 }}>
          {loading ? 'Loading agent…' : 'Agent not found'}
        </div>
        {!loading && <Link href="/passports" className="btn-ghost">← Back to passports</Link>}
      </div>
    )
  }

  const accent = accentColor(agent.color)
  const flow = flowFor(agent)

  return (
    <div className="animate-up gap-pad" style={{ maxWidth: 720 }}>
      <Link href="/passports" style={{ fontSize: 12, color: 'var(--ink3)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Back to passports
      </Link>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
        <div className="card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 26 }}>{agent.emoji || '🤖'}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{agent.name}</span>
                <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--ink3)', background: 'var(--card2)', padding: '2px 7px', borderRadius: 5 }}>{agent.chain}</span>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>
                {agent.shortAddr} · ${agent.spentToday}/${agent.dailyLimit} today
              </div>
            </div>
          </div>
          <span className={`badge ${agent.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{agent.status}</span>
        </div>
      </div>

      {flow !== 'none' && <AgentChat agent={agent} flowType={flow} onPropose={setChatProposal} />}

      {flow === 'research' && (
        <ResearchFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'research'}
          initialTopic={chatProposal?.type === 'research' ? chatProposal.params.topic : undefined}
          initialSourceIds={chatProposal?.type === 'research' ? chatProposal.params.sourceIds : undefined} />
      )}
      {flow === 'finance' && (
        <FinanceFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'finance'}
          initialBillName={chatProposal?.type === 'finance' ? chatProposal.params.billName : undefined}
          initialAction={chatProposal?.type === 'finance' ? chatProposal.params.action : undefined} />
      )}
      {flow === 'travel' && (
        <TravelFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'travel'}
          initialDestination={chatProposal?.type === 'travel' ? chatProposal.params.destination : undefined}
          initialMaxBudget={chatProposal?.type === 'travel' ? chatProposal.params.maxBudget : undefined} />
      )}
      {flow === 'defi' && (
        <DefiFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'defi'}
          initialFromToken={chatProposal?.type === 'defi' ? chatProposal.params.fromToken : undefined}
          initialAmountIn={chatProposal?.type === 'defi' ? chatProposal.params.amountIn : undefined} />
      )}
      {flow === 'api' && (
        <ApiPaymentFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'api'}
          initialResourceUrl={chatProposal?.type === 'api' ? chatProposal.params.resourceUrl : undefined} />
      )}
      {flow === 'none' && (
        <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 12.5 }}>
          This agent type isn't wired to a live task yet.
        </div>
      )}
    </div>
  )
}

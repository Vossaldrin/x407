'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useStore, Agent, accentColor } from '@/lib/store'
import { ApiPaymentFlow } from '@/components/agents/ApiPaymentFlow'
import { ResearchFlow } from '@/components/agents/ResearchFlow'
import { FinanceFlow } from '@/components/agents/FinanceFlow'
import { TravelFlow } from '@/components/agents/TravelFlow'
import { DefiFlow } from '@/components/agents/DefiFlow'
import { RefundFlow } from '@/components/agents/RefundFlow'
import { GroceryFlow } from '@/components/agents/GroceryFlow'
import { TriageFlow } from '@/components/agents/TriageFlow'
import { DependencyFlow } from '@/components/agents/DependencyFlow'
import { DocumentFilerFlow } from '@/components/agents/DocumentFilerFlow'
import { CalendarFlow } from '@/components/agents/CalendarFlow'
import { FormFillerFlow } from '@/components/agents/FormFillerFlow'
import { ReceiptFlow } from '@/components/agents/ReceiptFlow'
import { AgentChat } from '@/components/agents/AgentChat'
import { VerifyIdentityCard } from '@/components/agents/VerifyIdentityCard'
import { StaticFallback } from '@/components/agents/OrbFallback'
import { ProposedAction } from '@/lib/agent-chat'

const AgentOrb = dynamic(() => import('@/components/agents/AgentOrb'), {
  ssr: false,
  loading: () => <StaticFallback color="var(--ink3)" />,
})

type FlowType = 'research' | 'finance' | 'travel' | 'defi' | 'api' | 'refund' | 'grocery' | 'triage' | 'dependency' | 'document' | 'calendar' | 'formfiller' | 'receipt' | 'none'

const FLOW_BY_TEMPLATE: Record<string, FlowType> = {
  tpl_research_bot: 'research',
  tpl_budget_guard: 'finance',
  tpl_travel_planner: 'travel',
  tpl_defi_trader: 'defi',
  tpl_investment_agent: 'defi',
  tpl_customer_support: 'refund',
  tpl_grocery_scout: 'grocery',
  tpl_log_triage: 'triage',
  tpl_dependency_patch: 'dependency',
  tpl_inbox_filer: 'document',
  tpl_calendar_agent: 'calendar',
  tpl_form_filler: 'formfiller',
  tpl_receipt_logger: 'receipt',
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
  const trustBadge: Record<string, string> = {
    unverified: 'badge-gray', verified: 'badge-yellow', established: 'badge-green', trusted: 'badge-green',
  }
  const trustGrade = agent.trustGrade || 'unverified'

  return (
    <div className="animate-up gap-pad" style={{ maxWidth: 720 }}>
      <Link href="/passports" style={{ fontSize: 12, color: 'var(--ink3)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Back to passports
      </Link>

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
        <div style={{ width: 150, height: 150 }}>
          <AgentOrb color={accent} status={agent.status} />
        </div>
      </div>

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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className={`badge ${trustBadge[trustGrade]}`} title="x407 trust grade">{trustGrade}</span>
            <span className={`badge ${agent.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{agent.status}</span>
          </div>
        </div>
      </div>

      <VerifyIdentityCard agent={agent} />

      {flow !== 'none' && <AgentChat agent={agent} flowType={flow} onPropose={setChatProposal} />}

      {flow === 'research' && (
        <ResearchFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'research'}
          initialTopic={chatProposal?.type === 'research' ? chatProposal.params.topic : undefined}
          initialSourceIds={chatProposal?.type === 'research' ? chatProposal.params.sourceIds : undefined} />
      )}
      {flow === 'finance' && (
        <FinanceFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'finance'}
          initialBillName={chatProposal?.type === 'finance' ? chatProposal.params.billName : undefined}
          initialAmount={chatProposal?.type === 'finance' ? chatProposal.params.amount : undefined}
          initialPayToAddress={chatProposal?.type === 'finance' ? chatProposal.params.payToAddress : undefined} />
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
      {flow === 'refund' && (
        <RefundFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'refund'}
          initialCustomerName={chatProposal?.type === 'refund' ? chatProposal.params.customerName : undefined}
          initialAmount={chatProposal?.type === 'refund' ? chatProposal.params.amount : undefined}
          initialPayToAddress={chatProposal?.type === 'refund' ? chatProposal.params.payToAddress : undefined} />
      )}
      {flow === 'grocery' && (
        <GroceryFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'grocery'}
          initialItem={chatProposal?.type === 'grocery' ? chatProposal.params.item : undefined}
          initialMaxPrice={chatProposal?.type === 'grocery' ? chatProposal.params.maxPrice : undefined}
          initialPayToAddress={chatProposal?.type === 'grocery' ? chatProposal.params.payToAddress : undefined} />
      )}
      {flow === 'triage' && (
        <TriageFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'triage'}
          initialLogText={chatProposal?.type === 'triage' ? chatProposal.params.logText : undefined} />
      )}
      {flow === 'dependency' && (
        <DependencyFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'dependency'}
          initialPackage={chatProposal?.type === 'dependency' ? chatProposal.params.package : undefined} />
      )}
      {flow === 'document' && (
        <DocumentFilerFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'document'}
          initialDocumentText={chatProposal?.type === 'document' ? chatProposal.params.documentText : undefined} />
      )}
      {flow === 'calendar' && (
        <CalendarFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'calendar'}
          initialDescription={chatProposal?.type === 'calendar' ? chatProposal.params.description : undefined} />
      )}
      {flow === 'formfiller' && (
        <FormFillerFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'formfiller'}
          initialFormText={chatProposal?.type === 'formfiller' ? chatProposal.params.formText : undefined} />
      )}
      {flow === 'receipt' && (
        <ReceiptFlow agent={agent} key={chatProposal ? JSON.stringify(chatProposal) : 'receipt'}
          initialReceiptText={chatProposal?.type === 'receipt' ? chatProposal.params.receiptText : undefined} />
      )}
      {flow === 'none' && (
        <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 12.5 }}>
          This agent type isn't wired to a live task yet.
        </div>
      )}
    </div>
  )
}

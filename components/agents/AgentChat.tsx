'use client'
import { useState } from 'react'
import { Agent } from '@/lib/store'
import { sendChatMessage, ChatMessage, ProposedAction } from '@/lib/agent-chat'

function describeProposal(action: ProposedAction): string {
  const p = action.params
  switch (action.type) {
    case 'research': return `Research "${p.topic}" using ${(p.sourceIds || []).join(', ') || 'selected sources'}`
    case 'defi': return `Swap ${p.amountIn} ${p.fromToken} → ${p.fromToken === 'ETH' ? 'USDC' : 'ETH'}`
    case 'finance': return `${p.action === 'switch' ? 'Switch deal for' : 'Pay'} ${p.billName}`
    case 'travel': return `Search travel to ${p.destination}${p.maxBudget ? ` under $${p.maxBudget}` : ''}`
    case 'api': return `Pay for API${p.resourceUrl ? `: ${p.resourceUrl}` : ' (demo compute)'}`
    default: return 'Proposed action'
  }
}

export function AgentChat({ agent, flowType, onPropose }: {
  agent: Agent
  flowType: string
  onPropose: (action: ProposedAction) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState<ProposedAction | null>(null)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    const history = messages
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')
    setSending(true)
    setPending(null)

    const result = await sendChatMessage(agent.id, flowType, text, history)
    setSending(false)
    if (!result) return
    setMessages(p => [...p, { role: 'assistant', text: result.reply || '...' }])
    if (result.proposedAction) setPending(result.proposedAction)
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Ask {agent.name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 14 }}>
        Describe what you want in plain language. It can suggest a task — you always review and confirm before anything runs.
      </div>

      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, maxHeight: 320, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%', background: m.role === 'user' ? 'var(--red-dim)' : 'var(--card2)',
              color: m.role === 'user' ? 'var(--red)' : 'var(--ink)',
              borderRadius: 10, padding: '8px 12px', fontSize: 12.5, lineHeight: 1.5,
            }}>
              {m.text}
            </div>
          ))}
          {sending && <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>Thinking…</div>}
        </div>
      )}

      {pending && (
        <div style={{ background: 'var(--card2)', border: '0.5px solid var(--red)', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--ink)', flex: 1 }}>{describeProposal(pending)}</span>
          <button className="btn-primary" style={{ fontSize: 11.5 }} onClick={() => { onPropose(pending); setPending(null) }}>
            Review &amp; confirm →
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="field-input" style={{ flex: 1 }}
          placeholder="e.g. swap 0.02 ETH for USDC"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="btn-primary" disabled={sending || !input.trim()} onClick={send}>Send</button>
      </div>
    </div>
  )
}

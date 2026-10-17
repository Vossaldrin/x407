'use client'
import { Agent } from '@/lib/store'
import { TaskToolFlow } from '@/components/agents/TaskToolFlow'

export function TriageFlow({ agent, initialLogText }: { agent: Agent; initialLogText?: string }) {
  return (
    <TaskToolFlow
      agent={agent}
      sourceId="incident-escalate"
      title="Triage an incident"
      description="Paste a log snippet or alert — this agent pays to have it triaged for severity and a recommended next action."
      inputLabel="Log / alert text"
      inputPlaceholder="e.g. 503s spiking on /checkout since 14:02 UTC, error rate 12%..."
      initialInput={initialLogText}
      formatResult={r => r?.error ? <span style={{ color: 'var(--rose)' }}>{r.error}</span> : r?.output}
    />
  )
}

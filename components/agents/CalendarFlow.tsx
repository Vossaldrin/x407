'use client'
import { Agent } from '@/lib/store'
import { TaskToolFlow } from '@/components/agents/TaskToolFlow'

export function CalendarFlow({ agent, initialDescription }: { agent: Agent; initialDescription?: string }) {
  return (
    <TaskToolFlow
      agent={agent}
      sourceId="calendar-api"
      title="Schedule an appointment"
      description="Describe the appointment in plain language — this agent pays to structure and confirm it."
      inputLabel="Appointment description"
      inputPlaceholder="e.g. Book a 30-min call with Sam next Tuesday afternoon about the Q3 review"
      initialInput={initialDescription}
      formatResult={r => r?.error ? <span style={{ color: 'var(--rose)' }}>{r.error}</span> : r?.output}
    />
  )
}

'use client'
import { Agent } from '@/lib/store'
import { TaskToolFlow } from '@/components/agents/TaskToolFlow'

export function FormFillerFlow({ agent, initialFormText }: { agent: Agent; initialFormText?: string }) {
  return (
    <TaskToolFlow
      agent={agent}
      sourceId="lookup-api"
      title="Fill out a form"
      description="Give the target fields and your source data — this agent pays to map values into the form."
      inputLabel="Fields + source data"
      inputPlaceholder={'Fields: full name, email, start date\nSource: Jane Doe, jane@acme.com, starting March 3rd'}
      initialInput={initialFormText}
      formatResult={r => r?.error ? <span style={{ color: 'var(--rose)' }}>{r.error}</span> : r?.output}
    />
  )
}

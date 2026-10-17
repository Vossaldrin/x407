'use client'
import { Agent } from '@/lib/store'
import { TaskToolFlow } from '@/components/agents/TaskToolFlow'

export function DocumentFilerFlow({ agent, initialDocumentText }: { agent: Agent; initialDocumentText?: string }) {
  return (
    <TaskToolFlow
      agent={agent}
      sourceId="file-document"
      title="File a document"
      description="Paste an email or document — this agent pays to have it classified and filed with the key details extracted."
      inputLabel="Document / email text"
      inputPlaceholder="Paste the email or document text here..."
      initialInput={initialDocumentText}
      formatResult={r => r?.error ? <span style={{ color: 'var(--rose)' }}>{r.error}</span> : r?.output}
    />
  )
}

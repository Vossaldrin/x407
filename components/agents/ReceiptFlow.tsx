'use client'
import { useState } from 'react'
import { Agent } from '@/lib/store'
import { TaskToolFlow } from '@/components/agents/TaskToolFlow'

interface LoggedExpense { receiptText: string; output: string }

export function ReceiptFlow({ agent, initialReceiptText }: { agent: Agent; initialReceiptText?: string }) {
  const [log, setLog] = useState<LoggedExpense[]>([])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TaskToolFlow
        agent={agent}
        sourceId="receipt-parsing"
        title="Log an expense"
        description="Type in a receipt's details — this agent pays to parse and categorize it."
        inputLabel="Receipt / expense text"
        inputPlaceholder="e.g. Blue Bottle Coffee, $14.50, team meeting"
        initialInput={initialReceiptText}
        onResult={(result, input) => setLog(p => [{ receiptText: input, output: result?.output || result?.error || '' }, ...p])}
        formatResult={r => r?.error ? <span style={{ color: 'var(--rose)' }}>{r.error}</span> : r?.output}
      />

      {log.length > 0 && (
        <div className="card card-pad">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Logged this session</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {log.map((e, i) => (
              <div key={i} style={{ background: 'var(--card2)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>{e.receiptText}</div>
                <div style={{ fontSize: 12, color: 'var(--ink)' }}>{e.output}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

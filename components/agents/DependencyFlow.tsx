'use client'
import { Agent } from '@/lib/store'
import { TaskToolFlow } from '@/components/agents/TaskToolFlow'

export function DependencyFlow({ agent, initialPackage }: { agent: Agent; initialPackage?: string }) {
  return (
    <TaskToolFlow
      agent={agent}
      sourceId="trigger-patch"
      title="Check a dependency"
      description="Enter a package — this agent pays to check it against OSV.dev's real vulnerability database and trigger a patch if one's needed."
      inputLabel="Package name"
      inputPlaceholder="e.g. lodash"
      secondaryLabel="Ecosystem"
      secondaryPlaceholder="npm, PyPI, Go… (defaults to npm)"
      initialInput={initialPackage}
      formatResult={r => {
        if (r?.error) return <span style={{ color: 'var(--rose)' }}>{r.error}</span>
        if (!r?.vulnerabilityCount) return <span>No known vulnerabilities found for {r?.package}.</span>
        return (
          <div>
            <div style={{ marginBottom: 8 }}>{r.vulnerabilityCount} known vulnerabilit{r.vulnerabilityCount === 1 ? 'y' : 'ies'} for {r.package} ({r.ecosystem}):</div>
            {r.vulnerabilities.map((v: any) => (
              <div key={v.id} style={{ fontSize: 11.5, marginBottom: 6 }}>
                <span className="mono" style={{ color: 'var(--ink3)' }}>{v.id}</span>{v.severity ? ` · ${v.severity}` : ''}<br />{v.summary}
              </div>
            ))}
          </div>
        )
      }}
    />
  )
}

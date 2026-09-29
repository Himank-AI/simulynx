import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader, fieldClass } from '../components/ui.tsx'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'

export function HistoryPage() {
  const navigate = useNavigate()
  const { history, result, restore } = useStore()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return history
    return history.filter((entry) => `${entry.scenario.name} ${entry.scenario.rawPrompt}`.toLowerCase().includes(q))
  }, [history, query])

  return (
    <div>
      <PageHeader
        kicker="Session record"
        title="Simulation History"
        subtitle="Every completed run in this session. Restoring a run makes it the committed scenario across the cockpit."
      />
      <input
        className={`${fieldClass} mb-4 max-w-md`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by scenario"
        aria-label="Filter history"
      />
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-ink-400">
              <tr className="border-b border-line">
                <th className="px-4 py-2 font-medium">Scenario</th>
                <th className="px-4 py-2 font-medium">Completed</th>
                <th className="px-4 py-2 font-medium">Affected</th>
                <th className="px-4 py-2 font-medium">Risk</th>
                <th className="px-4 py-2 font-medium">Readiness</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                const active = entry.id === result.id
                return (
                  <tr key={entry.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-950">{entry.scenario.name}</div>
                      <div className="text-xs text-ink-400">{entry.scenario.rawPrompt}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDateTime(entry.completedAt)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(entry.result.affected)}</td>
                    <td className="px-4 py-3">{entry.result.transitionRisk}</td>
                    <td className="px-4 py-3 tabular-nums">{entry.result.skillReadiness}</td>
                    <td className="px-4 py-3 text-right">
                      {active ? (
                        <span className="text-xs font-medium text-brand-700">Committed</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            restore(entry.id)
                            navigate('/simulations')
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="px-4 py-6 text-sm text-ink-500">No run matches that filter.</p> : null}
      </div>
    </div>
  )
}

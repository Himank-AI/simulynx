import { useMemo } from 'react'
import { ComparisonBars } from '../components/charts.tsx'
import { Button, PageHeader, Panel, RiskBadge } from '../components/ui.tsx'
import { formatNumber, signedPercent } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'
import { canonicalScenarios, scenarioKey } from '../services/scenario/scenarioService.ts'
import { runSimulation } from '../services/simulation/simulationEngine.ts'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function ScenarioComparison() {
  const { scenario, result, openJoule } = useStore()
  const rows = useMemo(() => {
    const canonical = canonicalScenarios().map((item, index) => ({
      letter: LETTERS[index] ?? '?',
      result: runSimulation(item),
    }))
    const known = new Set(canonicalScenarios().map((item) => scenarioKey(item)))
    if (!known.has(scenarioKey(scenario))) {
      canonical.push({ letter: 'F', result })
    }
    return canonical
  }, [scenario, result])

  return (
    <div>
      <PageHeader
        kicker="Trade-offs"
        title="Scenario Comparison"
        subtitle="These runs share a method and differ in scope or investment. Nothing here is ranked."
        actions={
          <Button variant="secondary" onClick={() => openJoule('Explain the difference between Scenario B and Scenario C.')}>
            Why did these scenarios differ?
          </Button>
        }
      />
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-ink-400">
              <tr className="border-b border-line">
                {['Scenario', 'Automation', 'Affected workforce', 'Reskilling', 'Redeployment', 'Productivity impact', 'Skill readiness', 'Transition risk'].map((label) => (
                  <th key={label} className="px-3 py-2 font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const active = scenarioKey(row.result.scenario) === scenarioKey(scenario)
                const readiness = row.result.skillReadiness
                return (
                  <tr key={row.letter} className={active ? 'bg-brand-50' : 'border-b border-line'}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink-950">{row.letter}. {row.result.scenario.name}</div>
                      <div className="max-w-xs text-xs text-ink-400">{row.result.scenario.rawPrompt}</div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{Math.round(row.result.scenario.automationLevel * 100)}%</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.result.affected)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.result.reskillDemand)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.result.redeployDemand)}</td>
                    <td className="px-3 py-3">
                      <div className={row.result.productivityHorizon < 0 ? 'text-warn-700' : 'text-ink-900'}>
                        {signedPercent(row.result.productivityHorizon)} at horizon
                      </div>
                      <div className="text-xs text-ink-400">{signedPercent(row.result.productivityNearTerm)} near term</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="tabular-nums">{readiness}</div>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-ink-200">
                        <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${readiness}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge level={row.result.transitionRisk} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel className="mt-4" title="Pathway mix" subtitle="Reskill, redeploy, and high transition risk. Not a combined score.">
        <ComparisonBars
          rows={rows.map((row) => ({
            name: row.letter,
            affected: row.result.affected,
            reskill: row.result.reskillDemand,
            redeploy: row.result.redeployDemand,
            highRisk: row.result.pathways.HIGH_TRANSITION_RISK,
          }))}
        />
        <p className="mt-2 text-xs leading-5 text-ink-400">
          Scenario B and Scenario C keep the same 20% scope. The difference is the reskilling investment, not a larger population. The model does not estimate program cost, and it does not pick a winner.
        </p>
      </Panel>
    </div>
  )
}

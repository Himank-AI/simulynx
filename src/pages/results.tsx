import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DepartmentBars, PathwayDonut } from '../components/charts.tsx'
import { Badge, MetricNote, PageHeader, Panel, buttonClass } from '../components/ui.tsx'
import { PATHWAY_META } from '../content.ts'
import { formatNumber, signedPercent } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'
import { analyticsAdapter } from '../services/analytics/analyticsService.ts'
import { getDepartment, getPersona, getRole } from '../services/workforce/workforceService.ts'
import type { PersonaOutcome, RiskLevel } from '../types.ts'

type SortKey = 'persona' | 'role' | 'path' | 'gap' | 'learning' | 'mobility' | 'outcome'

const SEVERITY = ['HIGH_TRANSITION_RISK', 'ADDITIONAL_INTERVENTION', 'RESKILL', 'REDEPLOY', 'ROLE_REDESIGN', 'UNCHANGED']

export function SimulationResults() {
  const { result, openPersona } = useStore()
  const story = useMemo(() => analyticsAdapter.getStory(result), [result])
  const [sort, setSort] = useState<SortKey>('outcome')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const metrics = result.scenario.metrics
  const origin = result.departmentImpact.find((row) => row.kind === 'origin')
  const others = result.departmentImpact.filter((row) => row.kind !== 'origin')

  function toggleSort(key: SortKey) {
    if (sort === key) setDirection(direction === 'asc' ? 'desc' : 'asc')
    else {
      setSort(key)
      setDirection('asc')
    }
  }

  const rows = [...result.personaOutcomes].sort((a, b) => {
    const compared = sortValue(a, sort).localeCompare(sortValue(b, sort))
    return direction === 'asc' ? compared : -compared
  })

  return (
    <div>
      <PageHeader
        kicker="Simulation complete"
        title={result.scenario.name}
        subtitle={result.scenario.rawPrompt}
        actions={
          <>
            <Link to="/compare" className={buttonClass('secondary', 'sm')}>Compare</Link>
            <Link to="/what-if" className={buttonClass('secondary', 'sm')}>What if</Link>
            <Link to="/brief" className={buttonClass('primary', 'sm')}>Decision brief</Link>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-lg font-medium leading-7 text-ink-950">
            {result.affected > 0
              ? `${formatNumber(result.affected)} synthetic workforce personas are potentially affected under this scenario.`
              : 'No synthetic workforce personas are in scope. This run is a reference operating model.'}
          </p>
          <p className="mt-1 text-sm font-medium text-ink-500">Simulation result — not a prediction.</p>
          {origin ? (
            <p className="mt-2 text-sm leading-6 text-ink-600">
              {origin.name} accounts for {formatNumber(origin.affected)} of that total. {others.map((row) => `${row.name} ${formatNumber(row.affected)}`).join(', ')} are included because the model follows workflow, build, learning, and transition links. Direct automation share: {formatNumber(result.directScope)}.
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <RiskBadgeLabel level={result.transitionRisk} score={result.riskScore} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Mini label="Potentially affected" value={formatNumber(result.affected)} />
        <Mini label="Reskilling pathways" value={formatNumber(result.reskillDemand)} />
        <Mini label="Redeployment pathways" value={formatNumber(result.redeployDemand)} />
        <Mini label="Role redesign" value={formatNumber(result.pathways.ROLE_REDESIGN)} />
        <Mini label="High transition risk" value={formatNumber(result.pathways.HIGH_TRANSITION_RISK)} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Workforce impact" subtitle="Scaled model estimate">
          {metrics.workforceImpact ? <PathwayDonut story={story} /> : <MetricNote>Workforce impact was not selected for this scenario.</MetricNote>}
        </Panel>
        <Panel className="xl:col-span-2" title="Skill transition" subtitle="Current profile to the scenario’s future profile">
          {metrics.skills ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <SkillList title="Current skills" items={result.skillTransition.current} />
              <div className="text-center text-xs font-medium uppercase tracking-wide text-ink-300">to</div>
              <SkillList title="Future skills" items={result.skillTransition.future} />
            </div>
          ) : (
            <MetricNote>Skills were not selected for this scenario.</MetricNote>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Department impact" subtitle="Origin, enabling, and receiving load">
          {metrics.workforceImpact ? (
            <>
              <DepartmentBars story={story} />
              <ul className="mt-3 space-y-2">
                {result.departmentImpact.map((row) => (
                  <li key={row.key} className="text-sm leading-5 text-ink-600">
                    <span className="font-medium text-ink-900">{row.name}.</span> {row.narrative} Capacity strain {row.capacityStrain.toLowerCase()}. Workload change {row.netLoad > 0 ? '+' : ''}{row.netLoad}% · model estimate.
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <MetricNote>Workforce impact was not selected for this scenario.</MetricNote>
          )}
        </Panel>
        <Panel className="xl:col-span-2" title="Productivity and risk" subtitle="Model estimate at the stated horizon">
          {metrics.productivity ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-ink-400">Near term, months 1–4</dt>
                <dd className="text-lg font-semibold tabular-nums text-ink-950">{signedPercent(result.productivityNearTerm)}</dd>
              </div>
              <div>
                <dt className="text-ink-400">At month {result.scenario.timeHorizonMonths}</dt>
                <dd className="text-lg font-semibold tabular-nums text-ink-950">{signedPercent(result.productivityHorizon)}</dd>
              </div>
            </dl>
          ) : (
            <MetricNote>Productivity was not selected for this scenario.</MetricNote>
          )}
          {metrics.risk ? <p className="mt-4 text-sm leading-6 text-ink-600">{result.riskDriver}</p> : <div className="mt-4"><MetricNote>Risk was not selected for this scenario.</MetricNote></div>}
          {metrics.mobility ? (
            <p className="mt-3 text-sm text-ink-600">Skill readiness {result.skillReadiness}. Mobility is expressed through {formatNumber(result.redeployDemand)} redeployment pathways.</p>
          ) : null}
        </Panel>
      </div>

      <Panel className="mt-4" title="Persona impact" subtitle="Representative personas in scope. Pathway counts above are scaled; this table is not 1,842 rows." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-ink-400">
              <tr className="border-b border-line">
                <SortHead label="Persona" active={sort === 'persona'} onClick={() => toggleSort('persona')} />
                <SortHead label="Current role" active={sort === 'role'} onClick={() => toggleSort('role')} />
                <SortHead label="Potential path" active={sort === 'path'} onClick={() => toggleSort('path')} />
                <SortHead label="Skill gap" active={sort === 'gap'} onClick={() => toggleSort('gap')} />
                <SortHead label="Learning capacity" active={sort === 'learning'} onClick={() => toggleSort('learning')} />
                <SortHead label="Mobility" active={sort === 'mobility'} onClick={() => toggleSort('mobility')} />
                <SortHead label="Simulation outcome" active={sort === 'outcome'} onClick={() => toggleSort('outcome')} />
              </tr>
            </thead>
            <tbody>
              {rows.map((outcome) => {
                const persona = getPersona(outcome.personaId)
                if (!persona) return null
                const target = outcome.targetRoleId ? getRole(outcome.targetRoleId)?.name : outcome.pathway === 'ROLE_REDESIGN' ? 'Redesign current role' : 'Remain in current role'
                return (
                  <tr key={outcome.personaId} className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas" onClick={() => openPersona(outcome.personaId)}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-ink-950">{outcome.personaId}</div>
                      <div className="text-[11px] capitalize text-ink-400">{outcome.scope} · {getDepartment(persona.departmentId).name}</div>
                    </td>
                    <td className="px-4 py-2.5">{getRole(persona.roleId)?.name}</td>
                    <td className="px-4 py-2.5">{target}</td>
                    <td className="px-4 py-2.5">{outcome.skillGapLabel}</td>
                    <td className="px-4 py-2.5">{persona.learningCapacity}</td>
                    <td className="px-4 py-2.5">{persona.mobilityPotential}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={outcome.pathway === 'HIGH_TRANSITION_RISK' ? 'bad' : outcome.pathway === 'ADDITIONAL_INTERVENTION' ? 'warn' : 'neutral'}>
                        {PATHWAY_META[outcome.pathway].label}
                      </Badge>
                      <div className="mt-1 text-[11px] text-ink-400">Simulated pathway</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="px-4 py-6 text-sm text-ink-500">No representative persona is in scope.</p> : null}
        </div>
      </Panel>
      <p className="mt-3 text-xs leading-5 text-ink-400">
        {story.note} Story id {story.storyId}. Counts are model estimates for Demo Enterprise.
      </p>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-3 shadow-card">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-ink-950">{value}</div>
    </div>
  )
}

function SkillList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-ink-800">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function SortHead({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-2 font-medium">
      <button type="button" className={active ? 'text-ink-950' : ''} onClick={onClick}>
        {label}
      </button>
    </th>
  )
}

function sortValue(outcome: PersonaOutcome, key: SortKey): string {
  const persona = getPersona(outcome.personaId)
  if (key === 'persona') return outcome.personaId
  if (key === 'role') return getRole(persona?.roleId ?? '')?.name ?? ''
  if (key === 'path') return outcome.targetRoleId ? (getRole(outcome.targetRoleId)?.name ?? '') : outcome.pathway
  if (key === 'gap') return outcome.skillGapLabel
  if (key === 'learning') return persona?.learningCapacity ?? ''
  if (key === 'mobility') return persona?.mobilityPotential ?? ''
  return `${String(SEVERITY.indexOf(outcome.pathway)).padStart(2, '0')}-${outcome.personaId}`
}

function RiskBadgeLabel({ level, score }: { level: RiskLevel; score: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-400">Transition risk</div>
      <div className="mt-1 text-lg font-semibold text-ink-950">{level}</div>
      <div className="text-xs text-ink-400">Model score {score}</div>
    </div>
  )
}

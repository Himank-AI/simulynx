import { useMemo, useState } from 'react'
import { Badge, PageHeader, Panel } from '../components/ui.tsx'
import { cn } from '../lib/cn.ts'
import { formatNumber, signedPercent } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'
import { analyzeStress, type StressCase } from '../services/simulation/stress.ts'

export function StressTest() {
  const { scenario, result } = useStore()
  const cases = useMemo(() => analyzeStress(scenario, result.generatedAt), [scenario, result])
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? '')
  const selected = cases.find((item) => item.id === selectedId) ?? cases[0]

  return (
    <div>
      <PageHeader
        kicker={scenario.name}
        title="Decision Stress Test"
        subtitle="Challenge the assumptions behind the simulation."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="space-y-2">
          {cases.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                'block w-full rounded-xl border bg-surface p-4 text-left shadow-card',
                item.id === selected?.id ? 'border-brand-500' : 'border-line hover:border-brand-500/30',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-ink-950">{index + 1}. {item.title}</div>
                <div className="flex gap-1">
                  <Badge tone={item.severity === 'High' ? 'bad' : item.severity === 'Medium' ? 'warn' : 'neutral'}>Severity {item.severity}</Badge>
                  <Badge tone={item.sensitivity === 'High' ? 'warn' : 'neutral'}>Sensitivity {item.sensitivity}</Badge>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-500">Assumption: {item.assumption}</p>
              <p className="mt-1 text-sm leading-6 text-ink-700">{item.effect}</p>
              <p className="mt-1 text-xs text-ink-400">Affected workforce in the stress case: {formatNumber(item.result.affected)}</p>
            </button>
          ))}
        </div>
        {selected ? <StressVisual baseLabel={scenario.name} base={result} stress={selected} /> : null}
      </div>
    </div>
  )
}

function StressVisual({ baseLabel, base, stress }: { baseLabel: string; base: typeof resultShape; stress: StressCase }) {
  return (
    <Panel title="Base case to stress case" subtitle="The engine is re-run with one assumption worsened.">
      <div className="grid gap-3">
        <Block title="Base case" detail={baseLabel} rows={rowsFor(base.affected, base.pathways.HIGH_TRANSITION_RISK, base.skillReadiness, base.productivityNearTerm, base.productivityHorizon)} />
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">Stress case</div>
        <Block title={stress.title} detail={`Sensitivity ${stress.sensitivity}`} rows={rowsFor(stress.result.affected, stress.result.pathways.HIGH_TRANSITION_RISK, stress.result.skillReadiness, stress.result.productivityNearTerm, stress.result.productivityHorizon)} />
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm leading-6 text-ink-800">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Workforce effect</div>
          <p className="mt-1">{stress.effect}</p>
        </div>
      </div>
    </Panel>
  )
}

const resultShape = {
  affected: 0,
  pathways: { HIGH_TRANSITION_RISK: 0 },
  skillReadiness: 0,
  productivityNearTerm: 0,
  productivityHorizon: 0,
}

function rowsFor(affected: number, highRisk: number, readiness: number, near: number, horizon: number) {
  return [
    ['Affected', formatNumber(affected)],
    ['High transition risk', formatNumber(highRisk)],
    ['Skill readiness', String(readiness)],
    ['Near-term productivity', signedPercent(near)],
    ['Horizon productivity', signedPercent(horizon)],
  ] as [string, string][]
}

function Block({ title, detail, rows }: { title: string; detail: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-line px-3 py-3">
      <div className="text-sm font-medium text-ink-950">{title}</div>
      <div className="text-xs text-ink-400">{detail}</div>
      <dl className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-sm">
            <dt className="text-ink-500">{label}</dt>
            <dd className="tabular-nums text-ink-950">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

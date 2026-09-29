import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CounterfactualBars } from '../components/charts.tsx'
import { Button, PageHeader, Panel } from '../components/ui.tsx'
import { formatNumber, signedPercent } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'
import { counterfactualQuestion, runSimulation, withParams } from '../services/simulation/simulationEngine.ts'

export function WhatIf() {
  const navigate = useNavigate()
  const { scenario, result, whatIf, setWhatIf, resetWhatIf, stageWhatIf } = useStore()
  const automation = Math.min(50, Math.max(10, Math.round((whatIf.automationLevel || 0.1) * 100)))
  useEffect(() => {
    const normalized = automation / 100
    if (Math.abs(normalized - whatIf.automationLevel) > 0.001) setWhatIf({ automationLevel: normalized })
  }, [automation, setWhatIf, whatIf.automationLevel])
  const next = useMemo(
    () =>
      withParams(scenario, {
        automationLevel: automation / 100,
        reskillInvestment: whatIf.reskillInvestment,
        trainingCompletion: whatIf.trainingCompletion,
        redeployCapacity: whatIf.redeployCapacity,
      }),
    [scenario, automation, whatIf.reskillInvestment, whatIf.trainingCompletion, whatIf.redeployCapacity],
  )
  const varied = useMemo(() => runSimulation(next), [next])
  const question = counterfactualQuestion(scenario, next)
  const changed = Math.abs(varied.affected - result.affected) + Math.abs(varied.riskScore - result.riskScore) + Math.abs(varied.reskillDemand - result.reskillDemand) > 0

  return (
    <div>
      <PageHeader
        kicker="Counterfactual"
        title="What If?"
        subtitle="Move the assumptions. The committed simulation stays in place until you stage and run a new one."
        actions={
          <>
            <Button variant="secondary" onClick={resetWhatIf}>Reset to committed</Button>
            <Button
              onClick={() => {
                stageWhatIf()
                navigate('/studio')
              }}
            >
              Stage in Scenario Studio
            </Button>
          </>
        }
      />
      <p className="mb-4 text-base font-medium text-ink-950">{changed ? question : 'These settings match the committed scenario.'}</p>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="Controls" subtitle={`Committed: ${scenario.name}`}>
          <Slider
            label="Automation"
            minLabel="10%"
            maxLabel="50%"
            min={10}
            max={50}
            step={5}
            value={automation}
            display={`${automation}%`}
            onChange={(value) => setWhatIf({ automationLevel: value / 100 })}
          />
          <Slider
            label="Reskilling investment"
            minLabel="Low"
            maxLabel="High"
            min={0}
            max={100}
            step={5}
            value={Math.round(whatIf.reskillInvestment * 100)}
            display={bandLabel(whatIf.reskillInvestment)}
            onChange={(value) => setWhatIf({ reskillInvestment: value / 100 })}
          />
          <Slider
            label="Training completion"
            minLabel="50%"
            maxLabel="100%"
            min={50}
            max={100}
            step={5}
            value={Math.round(whatIf.trainingCompletion * 100)}
            display={`${Math.round(whatIf.trainingCompletion * 100)}%`}
            onChange={(value) => setWhatIf({ trainingCompletion: value / 100 })}
          />
          <Slider
            label="Redeployment capacity"
            minLabel="Low"
            maxLabel="High"
            min={0}
            max={100}
            step={5}
            value={Math.round(whatIf.redeployCapacity * 100)}
            display={bandLabel(whatIf.redeployCapacity)}
            onChange={(value) => setWhatIf({ redeployCapacity: value / 100 })}
          />
        </Panel>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Delta label="Affected personas" base={result.affected} next={varied.affected} />
            <Delta label="Skill gaps pressure" base={100 - result.skillReadiness} next={100 - varied.skillReadiness} suffix="" hint={`Readiness ${varied.skillReadiness}`} />
            <Delta label="Reskilling demand" base={result.reskillDemand} next={varied.reskillDemand} />
            <Delta label="Redeployment demand" base={result.redeployDemand} next={varied.redeployDemand} />
            <Delta label="Transition risk score" base={result.riskScore} next={varied.riskScore} hint={varied.transitionRisk} />
          </div>
          <Panel title="Pathway shift" subtitle={`${signedPercent(varied.productivityNearTerm)} near term · ${signedPercent(varied.productivityHorizon)} at the horizon`}>
            <CounterfactualBars committed={result.pathways} varied={varied.pathways} />
          </Panel>
          <p className="text-xs leading-5 text-ink-400">
            Counterfactual model estimate. Productivity and risk move with the controls; the affected population moves when automation changes. Program cost is outside the model.
          </p>
        </div>
      </div>
    </div>
  )
}

function bandLabel(value: number): string {
  if (value < 0.25) return 'Low'
  if (value < 0.45) return 'Guarded'
  if (value < 0.65) return 'Moderate'
  if (value < 0.85) return 'High'
  return 'Full'
}

function Slider({
  label,
  minLabel,
  maxLabel,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string
  minLabel: string
  maxLabel: string
  min: number
  max: number
  step: number
  value: number
  display: string
  onChange: (value: number) => void
}) {
  return (
    <label className="mb-4 block">
      <span className="flex items-center justify-between text-sm text-ink-800">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{display}</span>
      </span>
      <input
        className="mt-2 w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="mt-1 flex justify-between text-[11px] text-ink-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </span>
    </label>
  )
}

function Delta({ label, base, next, hint, suffix = '' }: { label: string; base: number; next: number; hint?: string; suffix?: string }) {
  const delta = next - base
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-3 shadow-card">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-ink-950">{formatNumber(next)}{suffix}</div>
      <div className="text-xs text-ink-500">{delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${formatNumber(delta)} vs committed`}{hint ? ` · ${hint}` : ''}</div>
    </div>
  )
}

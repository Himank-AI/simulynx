import { formatNumber, round1 } from '../../lib/format.ts'
import type { Band, EngineModifiers, Scenario, SimulationResult } from '../../types.ts'
import { runSimulation } from './simulationEngine.ts'

export interface StressCase {
  id: string
  title: string
  assumption: string
  result: SimulationResult
  severity: Band
  sensitivity: Band
  affectedDelta: number
  highRiskDelta: number
  readinessDelta: number
  productivityDelta: number
  effect: string
}

interface StressSpec {
  id: string
  title: string
  assumption: (scenario: Scenario) => string
  apply: (scenario: Scenario) => { scenario: Scenario; mods: EngineModifiers }
}

const SPECS: StressSpec[] = [
  {
    id: 'training-shortfall',
    title: 'Training completion is lower than expected.',
    assumption: (scenario) => `The committed run assumes training completion of ${Math.round(scenario.trainingCompletion * 100)}%.`,
    apply: (scenario) => ({
      scenario: { ...scenario, trainingCompletion: Math.max(0.5, round1(scenario.trainingCompletion * 0.72)) },
      mods: {},
    }),
  },
  {
    id: 'reskill-delay',
    title: 'Reskilling takes longer than planned.',
    assumption: (scenario) => `The reskilling cycle is assumed to fit inside ${scenario.timeHorizonMonths} months.`,
    apply: (scenario) => ({
      scenario: { ...scenario, reskillInvestment: round1(scenario.reskillInvestment * 0.55) },
      mods: { skillShiftPenalty: 4 },
    }),
  },
  {
    id: 'productivity-dip',
    title: 'Temporary productivity decreases further.',
    assumption: () => 'The near-term productivity change is assumed to be temporary and modest.',
    apply: (scenario) => ({ scenario, mods: { nearTermShock: 4.5 } }),
  },
  {
    id: 'receiving-capacity',
    title: 'Receiving departments have limited capacity.',
    assumption: (scenario) => `Redeployment capacity is assumed at ${Math.round(scenario.redeployCapacity * 100)}% of the modeled scale.`,
    apply: (scenario) => ({
      scenario: { ...scenario, redeployCapacity: Math.min(scenario.redeployCapacity * 0.4, 0.18) },
      mods: {},
    }),
  },
  {
    id: 'uptake',
    title: 'Employees do not transition at the expected rate.',
    assumption: () => 'Transition uptake is assumed to match mobility readiness in the synthetic workforce.',
    apply: (scenario) => ({ scenario, mods: { transitionUptake: 0.62 } }),
  },
  {
    id: 'skill-shift',
    title: 'Skill requirements change faster than expected.',
    assumption: () => 'The future skill profile is assumed to stay stable through the horizon.',
    apply: (scenario) => ({ scenario, mods: { skillShiftPenalty: 10 } }),
  },
]

function bandFrom(value: number, high: number, medium: number): Band {
  if (value >= high) return 'High'
  if (value >= medium) return 'Medium'
  return 'Low'
}

export function analyzeStress(scenario: Scenario, generatedAt?: string): StressCase[] {
  const base = runSimulation(scenario, {}, { id: `stress-base-${scenario.id}`, generatedAt })
  return SPECS.map((spec) => {
    const applied = spec.apply(scenario)
    const result = runSimulation(applied.scenario, applied.mods, {
      id: `stress-${spec.id}-${scenario.id}`,
      generatedAt,
    })
    const highRiskDelta = result.pathways.HIGH_TRANSITION_RISK - base.pathways.HIGH_TRANSITION_RISK
    const readinessDelta = result.skillReadiness - base.skillReadiness
    const productivityDelta = round1(result.productivityHorizon - base.productivityHorizon)
    const affectedDelta = result.affected - base.affected
    const nearDelta = round1(result.productivityNearTerm - base.productivityNearTerm)
    const magnitude = Math.max(
      Math.abs(result.riskScore - base.riskScore) * 0.9,
      Math.abs(highRiskDelta) / 18,
      Math.abs(productivityDelta) * 3,
      Math.abs(nearDelta) * 1.5,
      Math.abs(readinessDelta) * 0.7,
    )
    const sensitivity = bandFrom(magnitude, 6.5, 3)
    const severity = bandFrom(
      Math.max(
        result.transitionRisk === 'High' ? 8 : result.transitionRisk === 'Elevated' ? 5.2 : result.transitionRisk === 'Moderate' ? 3.2 : 1,
        result.productivityNearTerm <= -4 ? 7.5 : result.productivityNearTerm <= -2 ? 4 : 1,
        result.pathways.HIGH_TRANSITION_RISK >= 300 ? 7.2 : result.pathways.HIGH_TRANSITION_RISK >= 200 ? 4.2 : 1,
      ),
      6.5,
      3,
    )
    const scopeNote =
      affectedDelta === 0
        ? 'The population in scope does not change.'
        : `The affected population moves by ${affectedDelta > 0 ? '+' : ''}${formatNumber(affectedDelta)}.`
    const effect = `${scopeNote} High transition risk moves by ${highRiskDelta > 0 ? '+' : ''}${formatNumber(highRiskDelta)}. Skill readiness moves by ${readinessDelta > 0 ? '+' : ''}${readinessDelta}. Horizon productivity moves by ${productivityDelta > 0 ? '+' : ''}${productivityDelta.toFixed(1)} points${nearDelta !== 0 ? `, and the near-term estimate moves by ${nearDelta > 0 ? '+' : ''}${nearDelta.toFixed(1)}` : ''}.`
    return {
      id: spec.id,
      title: spec.title,
      assumption: spec.assumption(scenario),
      result,
      severity,
      sensitivity,
      affectedDelta,
      highRiskDelta,
      readinessDelta,
      productivityDelta,
      effect,
    }
  }).sort((a, b) => {
    const rank = { High: 3, Medium: 2, Low: 1 }
    return rank[b.sensitivity] - rank[a.sensitivity] || rank[b.severity] - rank[a.severity] || a.title.localeCompare(b.title)
  })
}

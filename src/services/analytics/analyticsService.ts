import { PATHWAY_META, PATHWAY_ORDER } from '../../content.ts'
import { formatNumber, signedPercent } from '../../lib/format.ts'
import type { AnalyticsStory, SimulationResult } from '../../types.ts'
import { getDepartment, getPersona, getRole, skillName } from '../workforce/workforceService.ts'
import { analyzeStress } from '../simulation/stress.ts'

export interface AnalyticsAdapter {
  readonly id: 'MockAnalyticsAdapter' | 'SapAnalyticsCloudAdapter'
  readonly connection: 'mock' | 'live'
  getStory(result: SimulationResult): AnalyticsStory
}

export class MockAnalyticsAdapter implements AnalyticsAdapter {
  readonly id = 'MockAnalyticsAdapter' as const
  readonly connection = 'mock' as const

  getStory(result: SimulationResult): AnalyticsStory {
    return {
      adapter: 'MockAnalyticsAdapter',
      connection: 'mock',
      storyId: `SAC-DEMO-${result.id}`,
      published: false,
      note: 'Chart series are prepared locally. Nothing is published to SAP Analytics Cloud.',
      pathwaySeries: PATHWAY_ORDER.map((key) => ({
        key,
        name: PATHWAY_META[key].label,
        value: result.pathways[key],
        fill: PATHWAY_META[key].color,
      })),
      departmentSeries: result.departmentImpact.map((row) => ({
        name: row.name,
        affected: row.affected,
      })),
    }
  }
}

export const analyticsAdapter: AnalyticsAdapter = new MockAnalyticsAdapter()

export interface DecisionBrief {
  title: string
  scenarioName: string
  prompt: string
  decision: string
  department: string
  horizon: string
  automation: string
  affected: string
  pathways: { label: string; value: string }[]
  skills: { current: string[]; future: string[] }
  mobility: string
  productivity: string
  risk: string
  assumptions: string[]
  alternatives: string[]
  questions: string[]
  limitations: string[]
  stress: string[]
}

export function buildDecisionBrief(result: SimulationResult, alternativeNames: string[]): DecisionBrief {
  const scenario = result.scenario
  const department = getDepartment(scenario.departmentId).name
  const stress = analyzeStress(scenario, result.generatedAt).slice(0, 3)
  return {
    title: 'Decision brief',
    scenarioName: scenario.name,
    prompt: scenario.rawPrompt,
    decision: scenario.decision,
    department,
    horizon: `${scenario.timeHorizonMonths} months`,
    automation: `${Math.round(scenario.automationLevel * 100)}%`,
    affected: formatNumber(result.affected),
    pathways: PATHWAY_ORDER.map((key) => ({
      label: PATHWAY_META[key].label,
      value: formatNumber(result.pathways[key]),
    })),
    skills: result.skillTransition,
    mobility: `${formatNumber(result.redeployDemand)} modeled redeployment pathways. ${formatNumber(result.reskillDemand)} modeled reskilling pathways.`,
    productivity: `Near term ${signedPercent(result.productivityNearTerm)}. At month ${scenario.timeHorizonMonths}: ${signedPercent(result.productivityHorizon)}.`,
    risk: `${result.transitionRisk}. ${result.riskDriver}`,
    assumptions: result.assumptions.map((item) => `${item.statement} Sensitivity noted in the model: ${item.sensitivity}.`),
    alternatives: alternativeNames,
    questions: decisionQuestions(result),
    limitations: result.limitations,
    stress: stress.map((item) => `${item.title} Measured sensitivity: ${item.sensitivity}. ${item.effect}`),
  }
}

export function decisionQuestions(result: SimulationResult): string[] {
  const scenario = result.scenario
  return [
    `Is a high-transition-risk population of ${formatNumber(result.pathways.HIGH_TRANSITION_RISK)} acceptable inside ${scenario.timeHorizonMonths} months?`,
    `Can receiving departments absorb ${formatNumber(result.redeployDemand)} redeployment pathways at the stated capacity?`,
    `Is a near-term productivity estimate of ${signedPercent(result.productivityNearTerm)} acceptable on the way to ${signedPercent(result.productivityHorizon)} at month ${scenario.timeHorizonMonths}?`,
    `Training completion is assumed at ${Math.round(scenario.trainingCompletion * 100)}%. What evidence would challenge that rate?`,
    'Which assumptions would Customer Support, Technology, Human Resources, and the receiving departments want tested before a decision?',
  ]
}

export function briefToMarkdown(brief: DecisionBrief): string {
  return [
    `# SIMULYNX decision brief`,
    ``,
    `Simulation environment using synthetic enterprise data. Not a prediction. Not a live SAP extract.`,
    ``,
    `## Decision tested`,
    brief.prompt,
    ``,
    `## Scenario`,
    `- Name: ${brief.scenarioName}`,
    `- Decision: ${brief.decision}`,
    `- Department: ${brief.department}`,
    `- Automation: ${brief.automation}`,
    `- Horizon: ${brief.horizon}`,
    ``,
    `## Workforce impact`,
    `${brief.affected} synthetic workforce personas are potentially affected under this scenario.`,
    ...brief.pathways.map((item) => `- ${item.label}: ${item.value}`),
    ``,
    `## Skill impact`,
    `- Current skills: ${brief.skills.current.join(', ')}`,
    `- Future skills: ${brief.skills.future.join(', ')}`,
    ``,
    `## Mobility opportunities`,
    brief.mobility,
    ``,
    `## Risks`,
    brief.risk,
    ...brief.stress.map((item) => `- ${item}`),
    ``,
    `## Key assumptions`,
    ...brief.assumptions.map((item) => `- ${item}`),
    ``,
    `## Alternative scenarios`,
    ...brief.alternatives.map((item) => `- ${item}`),
    ``,
    `## Questions for decision makers`,
    ...brief.questions.map((item) => `- ${item}`),
    ``,
    `## What the simulation does not know`,
    ...brief.limitations.map((item) => `- ${item}`),
    ``,
    `## Human decision required`,
    `Simulynx assembled simulated outcomes, assumptions, and trade-offs. It does not recommend an action.`,
    ``,
    `Don't ask what will happen after you commit.`,
    `Simulate it before you commit.`,
    ``,
  ].join('\n')
}

export function personaGapNames(personaId: string): string[] {
  const persona = getPersona(personaId)
  if (!persona) return []
  return persona.skillGapIds.map((id) => skillName(id))
}

export function personaRoleName(personaId: string): string {
  const persona = getPersona(personaId)
  if (!persona) return personaId
  return getRole(persona.roleId)?.name ?? persona.roleId
}

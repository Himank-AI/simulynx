import type { EvaluationMetrics, Interventions, Scenario, ScenarioDraft } from './types.ts'
import { getDepartment, listDepartments } from './catalog.ts'

export const DEFAULT_PROMPT = 'Automate 20% of Customer Support over the next 12 months.'

const ALL_METRICS: EvaluationMetrics = {
  workforceImpact: true,
  skills: true,
  mobility: true,
  productivity: true,
  risk: true,
}

export function emptyInterventions(): Interventions {
  return { reskilling: false, redeployment: false, roleRedesign: false, hiring: false }
}

export function investmentsFor(interventions: Interventions): Pick<Scenario, 'reskillInvestment' | 'trainingCompletion' | 'redeployCapacity'> {
  return {
    reskillInvestment: interventions.reskilling ? 0.82 : 0.22,
    trainingCompletion: interventions.reskilling ? 0.86 : 0.68,
    redeployCapacity: interventions.redeployment ? 0.84 : 0.32,
  }
}

function matchDepartment(text: string): string | null {
  const rules: [RegExp, string][] = [
    [/customer support|\bsupport\b/, 'dep-cs'],
    [/technolog|engineering/, 'dep-tech'],
    [/human resources|\bhr\b|learning & development|\bl&d\b/, 'dep-hr'],
    [/financ/, 'dep-fin'],
    [/operation/, 'dep-ops'],
    [/\bsales\b|customer success/, 'dep-sales'],
    [/product/, 'dep-product'],
    [/marketing/, 'dep-mkt'],
  ]
  for (const [pattern, id] of rules) {
    if (pattern.test(text)) return id
  }
  return null
}

export function parseDecision(text: string): ScenarioDraft {
  const rawPrompt = text.trim()
  const lower = rawPrompt.toLowerCase()
  const notes: string[] = []

  if (!rawPrompt) {
    return {
      rawPrompt: '',
      decision: 'Unspecified',
      departmentId: null,
      automationLevel: null,
      timeHorizonMonths: 12,
      horizonAssumed: true,
      automationAssumed: false,
      interventions: emptyInterventions(),
      metrics: { ...ALL_METRICS },
      notes: ['Enter a workforce decision to interpret.'],
      reskillInvestment: 0.22,
      trainingCompletion: 0.68,
      redeployCapacity: 0.32,
    }
  }

  const mentionsAutomation = /automat|ai[- ]assist|\bbots?\b/.test(lower)
  const mentionsReskill = /reskill|upskill|training|learning program/.test(lower)
  const mentionsRedeploy = /redeploy|re-deploy|transfer/.test(lower)
  const mentionsRedesign = /redesign|restructur|reorg|role design/.test(lower)
  const mentionsHiring = /hir(e|ing)|recruit|backfill/.test(lower)
  const mentionsBaseline = /baseline|status quo|no change|current operating model/.test(lower)

  let decision = 'Workforce change'
  if (mentionsBaseline && !mentionsAutomation) decision = 'Baseline'
  else if (mentionsAutomation) decision = 'Automation'
  else if (mentionsReskill) decision = 'Reskilling'
  else if (mentionsRedeploy) decision = 'Redeployment'
  else if (mentionsRedesign) decision = 'Role redesign'
  else if (mentionsHiring) decision = 'Hiring'

  const percentMatch = lower.match(/(\d{1,3})\s*%/)
  let automationLevel: number | null = null
  let automationAssumed = false
  if (percentMatch) {
    const parsed = Math.min(100, Number(percentMatch[1])) / 100
    automationLevel = decision === 'Baseline' ? 0 : parsed
    if (Number(percentMatch[1]) > 100) notes.push('Percentages above 100 were capped at 100.')
  } else if (decision === 'Automation') {
    automationLevel = 0.2
    automationAssumed = true
    notes.push('No percentage was stated. 20% is the working assumption until you change it.')
  } else if (decision === 'Baseline') {
    automationLevel = 0
  } else {
    automationLevel = 0
  }

  const departmentId = matchDepartment(lower)
  if (!departmentId) {
    notes.push('No target department was recognized. Choose one before building the scenario.')
  }

  const monthMatch = lower.match(/(\d+)\s*months?/)
  const yearMatch = lower.match(/(\d+)\s*years?/)
  let timeHorizonMonths = 12
  let horizonAssumed = false
  if (monthMatch) timeHorizonMonths = Number(monthMatch[1])
  else if (yearMatch) timeHorizonMonths = Number(yearMatch[1]) * 12
  else if (/quarter/.test(lower)) timeHorizonMonths = 3
  else if (/next year/.test(lower)) timeHorizonMonths = 12
  else {
    horizonAssumed = true
    notes.push('No time horizon was stated. 12 months is the working assumption.')
  }

  const interventions: Interventions = {
    reskilling: mentionsReskill,
    redeployment: mentionsRedeploy,
    roleRedesign: mentionsRedesign,
    hiring: mentionsHiring,
  }
  const investments = investmentsFor(interventions)

  if (decision === 'Automation' && !mentionsReskill && !mentionsRedeploy) {
    notes.push('No reskilling or redeployment program was stated. You can add those interventions before building.')
  }

  const article = /^[aeiou]/i.test(decision) ? 'an' : 'a'
  notes.unshift(
    departmentId
      ? `Read as ${article} ${decision.toLowerCase()} decision aimed at ${getDepartment(departmentId).name}.`
      : `Read as ${article} ${decision.toLowerCase()} decision. The department is still open.`,
  )

  return {
    rawPrompt,
    decision,
    departmentId,
    automationLevel,
    timeHorizonMonths,
    horizonAssumed,
    automationAssumed,
    interventions,
    metrics: { ...ALL_METRICS },
    notes,
    ...investments,
  }
}

export function draftToScenario(draft: ScenarioDraft, id: string, createdAt: string): Scenario {
  if (!draft.departmentId || draft.automationLevel === null) {
    throw new Error('Scenario is incomplete.')
  }
  const department = getDepartment(draft.departmentId)
  const percent = Math.round(draft.automationLevel * 100)
  const name =
    draft.decision === 'Baseline'
      ? 'Baseline'
      : draft.decision === 'Automation'
        ? `${percent}% Automation${draft.interventions.reskilling ? ' + Reskilling' : ''}${draft.interventions.redeployment ? ' + Redeployment' : ''}`
        : `${draft.decision} · ${department.name}`

  return {
    id,
    name,
    rawPrompt: draft.rawPrompt,
    decision: draft.decision,
    departmentId: draft.departmentId,
    automationLevel: draft.automationLevel,
    timeHorizonMonths: draft.timeHorizonMonths,
    interventions: { ...draft.interventions },
    metrics: { ...draft.metrics },
    reskillInvestment: draft.reskillInvestment,
    trainingCompletion: draft.trainingCompletion,
    redeployCapacity: draft.redeployCapacity,
    status: 'ready',
    createdAt,
  }
}

function baseScenario(partial: Omit<Scenario, 'metrics' | 'status'> & { status?: Scenario['status'] }): Scenario {
  return {
    ...partial,
    metrics: { ...ALL_METRICS },
    status: partial.status ?? 'complete',
  }
}

export function canonicalScenarios(): Scenario[] {
  return [
    baseScenario({
      id: 'baseline',
      name: 'Baseline',
      rawPrompt: 'Maintain the current Customer Support operating model.',
      decision: 'Baseline',
      departmentId: 'dep-cs',
      automationLevel: 0,
      timeHorizonMonths: 12,
      interventions: emptyInterventions(),
      reskillInvestment: 0.15,
      trainingCompletion: 0.7,
      redeployCapacity: 0.25,
      createdAt: '2026-09-01T10:00:00.000Z',
    }),
    baseScenario({
      id: 'auto-20',
      name: '20% Automation',
      rawPrompt: DEFAULT_PROMPT,
      decision: 'Automation',
      departmentId: 'dep-cs',
      automationLevel: 0.2,
      timeHorizonMonths: 12,
      interventions: emptyInterventions(),
      reskillInvestment: 0.22,
      trainingCompletion: 0.68,
      redeployCapacity: 0.32,
      createdAt: '2026-09-29T08:30:00.000Z',
    }),
    baseScenario({
      id: 'auto-20-reskill',
      name: '20% Automation + Reskilling',
      rawPrompt: 'Automate 20% of Customer Support over 12 months and fund a reskilling program.',
      decision: 'Automation',
      departmentId: 'dep-cs',
      automationLevel: 0.2,
      timeHorizonMonths: 12,
      interventions: { ...emptyInterventions(), reskilling: true },
      reskillInvestment: 0.82,
      trainingCompletion: 0.86,
      redeployCapacity: 0.36,
      createdAt: '2026-09-22T11:10:00.000Z',
    }),
    baseScenario({
      id: 'auto-20-redeploy',
      name: '20% Automation + Redeployment',
      rawPrompt: 'Automate 20% of Customer Support and redeploy affected capacity over 12 months.',
      decision: 'Automation',
      departmentId: 'dep-cs',
      automationLevel: 0.2,
      timeHorizonMonths: 12,
      interventions: { ...emptyInterventions(), redeployment: true },
      reskillInvestment: 0.28,
      trainingCompletion: 0.7,
      redeployCapacity: 0.84,
      createdAt: '2026-09-08T14:20:00.000Z',
    }),
    baseScenario({
      id: 'auto-10',
      name: '10% Automation',
      rawPrompt: 'Automate 10% of Customer Support over the next 12 months.',
      decision: 'Automation',
      departmentId: 'dep-cs',
      automationLevel: 0.1,
      timeHorizonMonths: 12,
      interventions: emptyInterventions(),
      reskillInvestment: 0.22,
      trainingCompletion: 0.68,
      redeployCapacity: 0.32,
      createdAt: '2026-09-15T09:00:00.000Z',
    }),
  ]
}

export function extraScenarios(): Scenario[] {
  return [
    baseScenario({
      id: 'ops-15',
      name: '15% Operations automation',
      rawPrompt: 'Automate 15% of Operations over the next 9 months.',
      decision: 'Automation',
      departmentId: 'dep-ops',
      automationLevel: 0.15,
      timeHorizonMonths: 9,
      interventions: emptyInterventions(),
      reskillInvestment: 0.24,
      trainingCompletion: 0.66,
      redeployCapacity: 0.3,
      createdAt: '2026-08-20T07:40:00.000Z',
    }),
    baseScenario({
      id: 'fin-forecast',
      name: 'Finance forecasting reskill',
      rawPrompt: 'Reskill Financial Analysts on forecasting over 6 months.',
      decision: 'Reskilling',
      departmentId: 'dep-fin',
      automationLevel: 0,
      timeHorizonMonths: 6,
      interventions: { ...emptyInterventions(), reskilling: true },
      reskillInvestment: 0.8,
      trainingCompletion: 0.84,
      redeployCapacity: 0.2,
      createdAt: '2026-08-11T13:15:00.000Z',
    }),
  ]
}

export function scenarioKey(scenario: Pick<Scenario, 'departmentId' | 'automationLevel' | 'timeHorizonMonths' | 'reskillInvestment' | 'trainingCompletion' | 'redeployCapacity' | 'interventions'>): string {
  return [
    scenario.departmentId,
    scenario.automationLevel.toFixed(2),
    scenario.timeHorizonMonths,
    scenario.reskillInvestment.toFixed(2),
    scenario.trainingCompletion.toFixed(2),
    scenario.redeployCapacity.toFixed(2),
    scenario.interventions.reskilling ? '1' : '0',
    scenario.interventions.redeployment ? '1' : '0',
    scenario.interventions.roleRedesign ? '1' : '0',
    scenario.interventions.hiring ? '1' : '0',
  ].join('|')
}

export function knownDepartments() {
  return listDepartments()
}

export const EXAMPLE_PROMPTS = [
  DEFAULT_PROMPT,
  'Automate 10% of Customer Support over the next 12 months.',
  'Automate 20% of Customer Support over 12 months and fund a reskilling program.',
  'Automate 20% of Customer Support and redeploy affected capacity over 12 months.',
  'Automate 15% of Operations over the next 9 months.',
]

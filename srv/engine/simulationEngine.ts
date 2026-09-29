import { MODEL_LIMITS, PATHWAY_META } from './content.ts'
import { allocate, bandValue, clamp, round1 } from './format.ts'
import type {
  Assumption,
  Band,
  DepartmentImpact,
  EngineModifiers,
  Pathway,
  Persona,
  PersonaOutcome,
  RiskLevel,
  Scenario,
  ScopeKind,
  SimulationResult,
} from './types.ts'
import { getDepartment, getPersona, listPersonas, skillName } from './catalog.ts'

const PATHWAYS: Pathway[] = [
  'RESKILL',
  'REDEPLOY',
  'ROLE_REDESIGN',
  'UNCHANGED',
  'HIGH_TRANSITION_RISK',
  'ADDITIONAL_INTERVENTION',
]

const SKILL_SHIFT: Record<string, { current: string[]; future: string[] }> = {
  'dep-cs': {
    current: ['sk-comm', 'sk-case', 'sk-process'],
    future: ['sk-ai-support', 'sk-oversight', 'sk-data'],
  },
  'dep-tech': {
    current: ['sk-python', 'sk-cloud', 'sk-sap'],
    future: ['sk-ai-eng', 'sk-oversight', 'sk-data'],
  },
  'dep-sales': {
    current: ['sk-pipeline', 'sk-negotiation', 'sk-success'],
    future: ['sk-data', 'sk-stake', 'sk-success'],
  },
  'dep-fin': {
    current: ['sk-fin', 'sk-sql', 'sk-forecast'],
    future: ['sk-forecast', 'sk-data', 'sk-oversight'],
  },
  'dep-hr': {
    current: ['sk-wfp', 'sk-change', 'sk-stake'],
    future: ['sk-data', 'sk-wfp', 'sk-learning'],
  },
  'dep-ops': {
    current: ['sk-process', 'sk-supply', 'sk-improve'],
    future: ['sk-oversight', 'sk-data', 'sk-improve'],
  },
  'dep-product': {
    current: ['sk-analytics', 'sk-stake', 'sk-data'],
    future: ['sk-ai-eng', 'sk-analytics', 'sk-oversight'],
  },
  'dep-mkt': {
    current: ['sk-campaign', 'sk-content', 'sk-comm'],
    future: ['sk-analytics', 'sk-data', 'sk-campaign'],
  },
}

const RECEIVING: Record<string, { id: string; label: string }[]> = {
  'dep-cs': [
    { id: 'dep-sales', label: 'Sales (Customer Success)' },
    { id: 'dep-ops', label: 'Operations' },
  ],
  'dep-tech': [{ id: 'dep-product', label: 'Product' }],
  'dep-sales': [{ id: 'dep-cs', label: 'Customer Support' }],
  'dep-fin': [{ id: 'dep-ops', label: 'Operations' }],
  'dep-hr': [{ id: 'dep-ops', label: 'Operations' }],
  'dep-ops': [{ id: 'dep-product', label: 'Product' }],
  'dep-product': [{ id: 'dep-mkt', label: 'Marketing' }],
  'dep-mkt': [{ id: 'dep-sales', label: 'Sales' }],
}

const RECEIVER_ROLES: Record<string, string[]> = {
  'dep-cs': ['role-css', 'role-csm', 'role-ops', 'role-proc'],
  'dep-tech': ['role-pa'],
  'dep-sales': ['role-cs-spec', 'role-cs-senior'],
  'dep-fin': ['role-ops', 'role-proc'],
  'dep-hr': ['role-ops'],
  'dep-ops': ['role-pa'],
  'dep-product': ['role-camp', 'role-mkt'],
  'dep-mkt': ['role-ae', 'role-css'],
}

const ENABLING_ROLES = new Set(['role-aie', 'role-sap', 'role-mob', 'role-ld'])

export function riskLevel(score: number): RiskLevel {
  if (score >= 72) return 'High'
  if (score >= 55) return 'Elevated'
  if (score >= 34) return 'Moderate'
  return 'Low'
}

function isBaselineLike(scenario: Scenario): boolean {
  return (
    scenario.automationLevel <= 0 &&
    scenario.reskillInvestment < 0.45 &&
    scenario.redeployCapacity < 0.5 &&
    !scenario.interventions.roleRedesign &&
    !scenario.interventions.hiring &&
    !scenario.interventions.reskilling &&
    !scenario.interventions.redeployment
  )
}

export function exposureMultiplier(departmentId: string): number {
  if (departmentId === 'dep-cs') return 1842 / 842
  return 1.86
}

export function directScope(scenario: Scenario): number {
  if (scenario.automationLevel <= 0) return 0
  const headcount = getDepartment(scenario.departmentId).headcount
  return Math.round(headcount * scenario.automationLevel)
}

export function affectedPopulation(scenario: Scenario): number {
  if (isBaselineLike(scenario)) return 0
  const department = getDepartment(scenario.departmentId)
  if (scenario.automationLevel > 0) {
    const direct = Math.round(department.headcount * scenario.automationLevel)
    return Math.round(direct * exposureMultiplier(scenario.departmentId))
  }
  if (scenario.interventions.reskilling || scenario.decision === 'Reskilling') {
    return Math.round(department.headcount * 0.18)
  }
  if (scenario.interventions.redeployment || scenario.decision === 'Redeployment') {
    return Math.round(department.headcount * 0.12)
  }
  if (scenario.interventions.roleRedesign) return Math.round(department.headcount * 0.1)
  return 0
}

function pathwayWeights(scenario: Scenario, mods: EngineModifiers): Record<Pathway, number> {
  if (isBaselineLike(scenario)) {
    return {
      UNCHANGED: 1,
      RESKILL: 0,
      REDEPLOY: 0,
      ROLE_REDESIGN: 0,
      HIGH_TRANSITION_RISK: 0,
      ADDITIONAL_INTERVENTION: 0,
    }
  }

  const automation = scenario.automationLevel
  const reskill = scenario.reskillInvestment
  const training = scenario.trainingCompletion
  const redeploy = scenario.redeployCapacity
  const uptake = mods.transitionUptake ?? 1

  let reskillWeight = 0.36 + reskill * 0.24 * training + (scenario.interventions.reskilling ? 0.04 : 0) - automation * 0.05
  let redeployWeight = 0.1 + redeploy * 0.32 + (scenario.interventions.redeployment ? 0.08 : 0) - reskill * 0.03
  let redesignWeight = 0.1 + (scenario.interventions.roleRedesign ? 0.1 : 0)
  let unchangedWeight = Math.max(0.06, 0.22 - automation * 0.36 - reskill * 0.03)
  let highRiskWeight = Math.max(0.04, 0.08 + automation * 0.32 - reskill * training * 0.2 - redeploy * 0.05 - (scenario.interventions.hiring ? 0.02 : 0))
  let additionalWeight = Math.max(0.04, 0.075 + automation * 0.08 - reskill * 0.04 - redeploy * 0.025)

  if (uptake < 1) {
    const slipReskill = reskillWeight * (1 - uptake) * 0.55
    const slipRedeploy = redeployWeight * (1 - uptake) * 0.45
    reskillWeight -= slipReskill
    redeployWeight -= slipRedeploy
    highRiskWeight += (slipReskill + slipRedeploy) * 0.62
    additionalWeight += (slipReskill + slipRedeploy) * 0.38
  }

  const raw: Record<Pathway, number> = {
    RESKILL: reskillWeight,
    REDEPLOY: redeployWeight,
    ROLE_REDESIGN: redesignWeight,
    UNCHANGED: unchangedWeight,
    HIGH_TRANSITION_RISK: highRiskWeight,
    ADDITIONAL_INTERVENTION: additionalWeight,
  }
  return raw
}

function scoreRisk(scenario: Scenario, mods: EngineModifiers): number {
  if (isBaselineLike(scenario)) return 18
  if (scenario.automationLevel <= 0) {
    return clamp(
      Math.round(22 + (1 - scenario.trainingCompletion) * 20 + (1 - scenario.reskillInvestment) * 10),
      12,
      48,
    )
  }
  let score =
    scenario.automationLevel * 148 +
    (1 - scenario.trainingCompletion) * 28 +
    (1 - scenario.reskillInvestment) * 16 +
    (1 - scenario.redeployCapacity) * 18 -
    (scenario.interventions.roleRedesign ? 4 : 0) -
    (scenario.interventions.hiring ? 2 : 0)
  score += (mods.skillShiftPenalty ?? 0) * 0.55
  if ((mods.transitionUptake ?? 1) < 1) score += (1 - (mods.transitionUptake ?? 1)) * 16
  if ((mods.nearTermShock ?? 0) > 0) score += 4
  return clamp(Math.round(score), 8, 96)
}

function productivity(scenario: Scenario, riskScore: number, mods: EngineModifiers): { near: number; horizon: number } {
  if (isBaselineLike(scenario)) return { near: 0, horizon: 0 }
  const structural = scenario.automationLevel * 24
  const learning = scenario.reskillInvestment * scenario.trainingCompletion * 3.6
  const movement = scenario.redeployCapacity * (scenario.automationLevel > 0 ? 0.9 : 0.3)
  const hiring = scenario.interventions.hiring ? 0.4 : 0
  const drag = (1 - scenario.trainingCompletion) * 3.4 + (riskScore / 100) * 2.2
  const horizon = round1(structural + learning + movement + hiring - drag)
  const near = round1(horizon - scenario.automationLevel * 17 - scenario.reskillInvestment * 4.2 - (mods.nearTermShock ?? 0))
  return { near, horizon }
}

function readiness(scenario: Scenario, mods: EngineModifiers): number {
  const base = getDepartment(scenario.departmentId).readiness
  if (isBaselineLike(scenario)) return base
  const drop = scenario.automationLevel * 40
  const build = scenario.reskillInvestment * scenario.trainingCompletion * 28 + scenario.redeployCapacity * 2
  return clamp(Math.round(base - drop + build - (mods.skillShiftPenalty ?? 0)), 18, 94)
}

function riskDriver(scenario: Scenario): string {
  if (isBaselineLike(scenario)) {
    return 'No decision-driven transition is in scope. This is the reference operating model.'
  }
  const factors: string[] = []
  if (scenario.automationLevel >= 0.2) factors.push('automation scope')
  else if (scenario.automationLevel > 0) factors.push('a smaller automation scope')
  if (scenario.reskillInvestment < 0.5) factors.push('limited reskilling investment')
  else factors.push('reskilling investment')
  if (scenario.redeployCapacity >= 0.6) factors.push('stated redeployment capacity')
  else factors.push('limited redeployment capacity')
  if (scenario.trainingCompletion < 0.75) factors.push('training completion below 75%')
  return `Principal factors in the model: ${factors.join(', ')}.`
}

function skillTransition(scenario: Scenario): { current: string[]; future: string[] } {
  const shift = SKILL_SHIFT[scenario.departmentId]
  const department = getDepartment(scenario.departmentId)
  const current = (shift?.current ?? department.majorSkillIds.slice(0, 3)).map((id) => skillName(id))
  const future = (shift?.future ?? department.gapSkillIds.slice(0, 3)).map((id) => skillName(id))
  return { current, future }
}

function strain(kind: DepartmentImpact['kind'], scenario: Scenario): Band {
  if (kind === 'receiving') {
    if (scenario.redeployCapacity < 0.35) return 'High'
    if (scenario.redeployCapacity < 0.6) return 'Medium'
    return 'Low'
  }
  if (kind === 'origin') return scenario.automationLevel >= 0.3 ? 'High' : 'Medium'
  return scenario.reskillInvestment >= 0.6 || scenario.automationLevel >= 0.2 ? 'Medium' : 'Low'
}

function departmentImpact(scenario: Scenario, affected: number): DepartmentImpact[] {
  if (affected <= 0) return []
  const origin = getDepartment(scenario.departmentId)
  const rows: { key: string; name: string; weight: number; kind: DepartmentImpact['kind']; narrative: string; netLoad: number }[] = []
  rows.push({
    key: origin.id,
    name: origin.name,
    weight: 1.74,
    kind: 'origin',
    netLoad: round1(-scenario.automationLevel * 100),
    narrative: `${origin.name} carries the decision scope. Modeled work shifts toward the future skill profile over ${scenario.timeHorizonMonths} months.`,
  })
  if (scenario.automationLevel > 0 && origin.id !== 'dep-tech') {
    rows.push({
      key: 'dep-tech',
      name: 'Technology',
      weight: 0.26,
      kind: 'enabling',
      netLoad: round1(scenario.automationLevel * 40),
      narrative: 'Technology carries build and run load for the automated share. This is enabling work, not the same transition as the origin department.',
    })
  }
  if (origin.id !== 'dep-hr') {
    rows.push({
      key: 'dep-hr',
      name: 'Human Resources',
      weight: 0.08,
      kind: 'enabling',
      netLoad: round1(8 + scenario.redeployCapacity * 10),
      narrative: 'Human Resources carries mobility design for the transition. The model does not estimate individual casework.',
    })
  }
  rows.push({
    key: 'fn-ld',
    name: 'Learning & Development',
    weight: 0.1 + scenario.reskillInvestment * 0.08,
    kind: 'enabling',
    netLoad: round1(scenario.reskillInvestment * 28),
    narrative: 'Learning & Development, inside Human Resources, carries curriculum and completion management for the reskilling pathway.',
  })
  const receivers = RECEIVING[origin.id] ?? []
  rows.push({
    key: 'receiving',
    name: 'Receiving departments',
    weight: 0.12 + scenario.redeployCapacity * 0.1,
    kind: 'receiving',
    netLoad: round1(scenario.redeployCapacity * Math.max(scenario.automationLevel, 0.08) * 50),
    narrative: `Receiving capacity is modeled in ${receivers.map((item) => item.label).join(' and ') || 'adjacent departments'}. Strain rises when redeployment pathways exceed stated capacity.`,
  })

  const counts = allocate(affected, rows.map((row) => row.weight))
  return rows.map((row, index) => ({
    key: row.key,
    name: row.name,
    kind: row.kind,
    affected: counts[index] ?? 0,
    narrative: row.narrative,
    capacityStrain: strain(row.kind, scenario),
    netLoad: row.netLoad,
  }))
}

function assumptions(scenario: Scenario, redeployDemand: number): Assumption[] {
  const trainingSensitivity: Band = scenario.trainingCompletion < 0.75 ? 'High' : 'Medium'
  const capacitySensitivity: Band = scenario.redeployCapacity < 0.5 ? 'High' : 'Medium'
  const durationSensitivity: Band = scenario.timeHorizonMonths < 9 ? 'High' : 'Medium'
  return [
    {
      id: 'training',
      statement: `Training completion holds at ${Math.round(scenario.trainingCompletion * 100)}%.`,
      sensitivity: trainingSensitivity,
      source: 'Scenario assumption',
    },
    {
      id: 'duration',
      statement: `The reskilling cycle fits inside ${scenario.timeHorizonMonths} months.`,
      sensitivity: durationSensitivity,
      source: 'Scenario assumption',
    },
    {
      id: 'productivity',
      statement: 'The near-term productivity change is temporary and recovers inside the horizon.',
      sensitivity: 'High',
      source: 'Scenario assumption',
    },
    {
      id: 'capacity',
      statement: `Receiving departments can absorb ${redeployDemand.toLocaleString('en-US')} redeployment pathways.`,
      sensitivity: capacitySensitivity,
      source: 'Organization structure',
    },
    {
      id: 'uptake',
      statement: 'People in the synthetic workforce take up transitions at the rate implied by mobility readiness.',
      sensitivity: 'High',
      source: 'Workforce model',
    },
    {
      id: 'skills-stable',
      statement: 'The future skill profile stays stable through the horizon.',
      sensitivity: 'Medium',
      source: 'Scenario assumption',
    },
    {
      id: 'linear',
      statement: 'Automation is introduced across the horizon rather than as a single cutover.',
      sensitivity: 'Low',
      source: 'Scenario assumption',
    },
    {
      id: 'attrition',
      statement: scenario.interventions.hiring
        ? 'Hiring is modeled only as backfill capacity, not as a full workforce plan.'
        : 'Attrition stays at the Demo Enterprise baseline. No hiring program is in this scenario.',
      sensitivity: 'Medium',
      source: 'Model boundary',
    },
  ]
}

function transitionScore(persona: Persona, scenario: Scenario): number {
  const levels = persona.currentSkills.map((skill) => skill.level)
  const average = levels.length ? levels.reduce((sum, level) => sum + level, 0) / levels.length / 5 : 0.4
  const gap = Math.min(persona.skillGapIds.length, 4) / 4
  const sameDepartment = persona.departmentId === scenario.departmentId ? 0.1 : 0.04
  const workloadPenalty = persona.workload >= 90 ? 0.08 : persona.workload >= 85 ? 0.03 : 0
  const score =
    bandValue(persona.learningCapacity) * 0.28 +
    bandValue(persona.mobilityPotential) * 0.16 +
    bandValue(persona.learningAdaptability) * 0.18 +
    bandValue(persona.changeTolerance) * 0.12 +
    average * 0.16 +
    sameDepartment -
    gap * 0.18 -
    workloadPenalty -
    scenario.automationLevel * 0.12
  return clamp(Math.round(score * 100), 5, 96)
}

function isManager(persona: Persona): boolean {
  return persona.roleId.endsWith('-mgr') || persona.roleId === 'role-em' || persona.roleId === 'role-csm' || persona.careerStage === 'Lead'
}

function classify(persona: Persona, scenario: Scenario, scope: ScopeKind): Pathway {
  if (scope === 'receiving') return 'UNCHANGED'
  if (scope === 'enabling' && (persona.roleId === 'role-mob' || persona.roleId === 'role-ld' || persona.roleId === 'role-aie')) {
    return 'UNCHANGED'
  }
  if (persona.roleId === 'role-cs-ai' || persona.roleId === 'role-aie') return 'UNCHANGED'

  const gap = persona.skillGapIds.length
  const fundedReskill = scenario.reskillInvestment >= 0.7 && scenario.trainingCompletion >= 0.8
  const fundedRedeploy = scenario.redeployCapacity >= 0.6

  if ((persona.roleId === 'role-cs-mgr' || persona.roleId === 'role-em') && scenario.automationLevel > 0) {
    return 'ROLE_REDESIGN'
  }
  if (persona.learningCapacity === 'Low' && gap >= 1 && scenario.automationLevel >= 0.15 && !fundedReskill) {
    return 'HIGH_TRANSITION_RISK'
  }
  if (persona.changeTolerance === 'Low' && persona.workload >= 88 && !fundedReskill && scope === 'origin') {
    return 'ADDITIONAL_INTERVENTION'
  }
  if (
    persona.mobilityPotential === 'High' &&
    persona.learningCapacity !== 'High' &&
    persona.potentialTransitionRoleIds.length > 0 &&
    scope === 'origin'
  ) {
    return 'REDEPLOY'
  }
  if (fundedRedeploy && persona.mobilityPotential !== 'Low' && persona.learningCapacity !== 'High' && persona.potentialTransitionRoleIds.length > 0 && scope === 'origin') {
    return 'REDEPLOY'
  }
  if (scenario.interventions.roleRedesign && isManager(persona)) return 'ROLE_REDESIGN'
  if ((persona.learningCapacity === 'High' || persona.learningCapacity === 'Medium') && gap > 0 && persona.learningAdaptability !== 'Low') {
    return 'RESKILL'
  }
  if (gap === 0) return 'UNCHANGED'
  if (persona.learningCapacity === 'Low') return 'HIGH_TRANSITION_RISK'
  return 'ADDITIONAL_INTERVENTION'
}

function scopeReason(scope: ScopeKind, departmentName: string): string {
  if (scope === 'origin') return `In scope because the role sits in ${departmentName}, the decision's target department.`
  if (scope === 'enabling') return 'In scope as enabling capacity for automation build, learning, or mobility.'
  return `In scope as receiving capacity for transitions out of ${departmentName}.`
}

function pickReceivers(scenario: Scenario, personas: Persona[]): Persona[] {
  const roles = RECEIVER_ROLES[scenario.departmentId] ?? []
  const picked: Persona[] = []
  for (const roleId of roles) {
    const found = personas
      .filter((persona) => persona.roleId === roleId && persona.departmentId !== scenario.departmentId)
      .sort((a, b) => a.personaId.localeCompare(b.personaId))[0]
    if (found) picked.push(found)
  }
  return picked
}

function personasInScope(scenario: Scenario): { persona: Persona; scope: ScopeKind }[] {
  if (isBaselineLike(scenario)) return []
  const personas = listPersonas()
  const chosen: { persona: Persona; scope: ScopeKind }[] = []
  const seen = new Set<string>()
  const add = (persona: Persona, scope: ScopeKind) => {
    if (seen.has(persona.personaId)) return
    seen.add(persona.personaId)
    chosen.push({ persona, scope })
  }

  for (const persona of personas) {
    if (persona.departmentId === scenario.departmentId) add(persona, 'origin')
  }
  if (scenario.automationLevel > 0 && scenario.departmentId !== 'dep-tech') {
    for (const persona of personas) {
      if (ENABLING_ROLES.has(persona.roleId) && persona.departmentId !== scenario.departmentId) {
        if (persona.roleId === 'role-aie' || persona.roleId === 'role-sap' || persona.roleId === 'role-mob' || persona.roleId === 'role-ld') {
          add(persona, 'enabling')
        }
      }
    }
    const senior = personas
      .filter((persona) => persona.roleId === 'role-sse')
      .sort((a, b) => a.personaId.localeCompare(b.personaId))[0]
    if (senior) add(senior, 'enabling')
  } else if (scenario.departmentId !== 'dep-hr') {
    for (const persona of personas) {
      if (persona.roleId === 'role-mob' || persona.roleId === 'role-ld') add(persona, 'enabling')
    }
  }
  for (const persona of pickReceivers(scenario, personas)) add(persona, 'receiving')
  return chosen.sort((a, b) => a.persona.personaId.localeCompare(b.persona.personaId))
}

function flip(
  outcomes: PersonaOutcome[],
  from: Pathway,
  to: Pathway,
  count: number,
  direction: 'lowest' | 'highest',
  note: string,
  allow: (outcome: PersonaOutcome) => boolean = () => true,
) {
  const rows = outcomes.filter((outcome) => outcome.pathway === from && allow(outcome))
  rows.sort((a, b) => {
    const delta = direction === 'lowest' ? a.transitionScore - b.transitionScore : b.transitionScore - a.transitionScore
    return delta || a.personaId.localeCompare(b.personaId)
  })
  for (const row of rows.slice(0, count)) {
    row.pathway = to
    row.simulatedPathwayLabel = PATHWAY_META[to].label
    if (!row.rationale.includes(note)) row.rationale = `${row.rationale} ${note}`
  }
}

function adjustOutcomes(outcomes: PersonaOutcome[], scenario: Scenario, mods: EngineModifiers) {
  const personaOf = (id: string) => getPersona(id)
  if (scenario.trainingCompletion < 0.62) {
    const count = scenario.trainingCompletion < 0.55 ? 2 : 1
    flip(
      outcomes,
      'RESKILL',
      'HIGH_TRANSITION_RISK',
      count,
      'lowest',
      'Adjusted because training completion is below the level this pathway assumes.',
      (outcome) => personaOf(outcome.personaId)?.learningCapacity !== 'High',
    )
  }
  if (scenario.redeployCapacity < 0.3) {
    flip(
      outcomes,
      'REDEPLOY',
      'ADDITIONAL_INTERVENTION',
      1,
      'lowest',
      'Adjusted because receiving capacity is below the level this pathway assumes.',
      (outcome) => personaOf(outcome.personaId)?.mobilityPotential !== 'High',
    )
  }
  const uptake = mods.transitionUptake ?? 1
  if (uptake < 0.95) {
    const reskillCount = outcomes.filter((outcome) => outcome.pathway === 'RESKILL').length
    const count = Math.max(1, Math.round(reskillCount * (1 - uptake)))
    flip(outcomes, 'RESKILL', 'HIGH_TRANSITION_RISK', count, 'lowest', 'Adjusted because transition uptake is below plan.')
  }
  if (scenario.reskillInvestment >= 0.75 && scenario.trainingCompletion >= 0.8) {
    flip(
      outcomes,
      'HIGH_TRANSITION_RISK',
      'RESKILL',
      2,
      'highest',
      'Adjusted because the scenario funds a reskilling program at high completion.',
      (outcome) => personaOf(outcome.personaId)?.learningAdaptability !== 'Low',
    )
  }
  if (scenario.redeployCapacity >= 0.75) {
    flip(
      outcomes,
      'RESKILL',
      'REDEPLOY',
      2,
      'highest',
      'Adjusted because redeployment capacity is high and mobility is available.',
      (outcome) => {
        const persona = personaOf(outcome.personaId)
        return !!persona && persona.mobilityPotential !== 'Low' && persona.learningCapacity !== 'High' && persona.potentialTransitionRoleIds.length > 0
      },
    )
  }
}

function buildOutcomes(scenario: Scenario, mods: EngineModifiers): PersonaOutcome[] {
  const departmentName = getDepartment(scenario.departmentId).name
  const outcomes = personasInScope(scenario).map(({ persona, scope }) => {
    const pathway = classify(persona, scenario, scope)
    const targetRoleId = scope === 'origin' ? persona.potentialTransitionRoleIds[0] : undefined
    const gap = persona.skillGapIds[0]
    const access = persona.accessibilityContext
      ? ' Accessibility context is a work-design constraint and is not part of the score.'
      : ''
    return {
      personaId: persona.personaId,
      scope,
      pathway,
      simulatedPathwayLabel: PATHWAY_META[pathway].label,
      transitionScore: transitionScore(persona, scenario),
      skillGapLabel: gap ? skillName(gap) : 'None modeled',
      targetRoleId,
      rationale: `${scopeReason(scope, departmentName)} Simulated pathway: ${PATHWAY_META[pathway].label}. Model estimate uses skill alignment, learning capacity (${persona.learningCapacity.toLowerCase()}), and mobility (${persona.mobilityPotential.toLowerCase()}).${access}`,
    }
  })
  adjustOutcomes(outcomes, scenario, mods)
  return outcomes
}

export function runSimulation(
  scenario: Scenario,
  mods: EngineModifiers = {},
  meta: { id?: string; generatedAt?: string } = {},
): SimulationResult {
  const affected = affectedPopulation(scenario)
  const weights = pathwayWeights(scenario, mods)
  const counts = allocate(affected, PATHWAYS.map((pathway) => weights[pathway]))
  const pathways = Object.fromEntries(PATHWAYS.map((pathway, index) => [pathway, counts[index] ?? 0])) as Record<Pathway, number>
  const riskScore = scoreRisk(scenario, mods)
  const productivityEstimate = productivity(scenario, riskScore, mods)
  const redeployDemand = pathways.REDEPLOY
  return {
    id: meta.id ?? `sim-${scenario.id}`,
    generatedAt: meta.generatedAt ?? scenario.createdAt,
    scenario,
    affected,
    directScope: directScope(scenario),
    pathways,
    productivityNearTerm: productivityEstimate.near,
    productivityHorizon: productivityEstimate.horizon,
    skillReadiness: readiness(scenario, mods),
    transitionRisk: riskLevel(riskScore),
    riskScore,
    riskDriver: riskDriver(scenario),
    skillTransition: skillTransition(scenario),
    departmentImpact: departmentImpact(scenario, affected),
    personaOutcomes: buildOutcomes(scenario, mods),
    assumptions: assumptions(scenario, redeployDemand),
    reskillDemand: pathways.RESKILL,
    redeployDemand,
    limitations: MODEL_LIMITS,
  }
}

export function withParams(
  scenario: Scenario,
  params: Partial<Pick<Scenario, 'automationLevel' | 'reskillInvestment' | 'trainingCompletion' | 'redeployCapacity' | 'timeHorizonMonths'>>,
): Scenario {
  const next: Scenario = {
    ...scenario,
    ...params,
    interventions: { ...scenario.interventions },
    metrics: { ...scenario.metrics },
  }
  next.interventions.reskilling = next.reskillInvestment >= 0.55
  next.interventions.redeployment = next.redeployCapacity >= 0.6
  const department = getDepartment(next.departmentId)
  const percent = Math.round(next.automationLevel * 100)
  const extras = [
    next.interventions.reskilling ? 'Reskilling' : '',
    next.interventions.redeployment ? 'Redeployment' : '',
  ].filter(Boolean)
  next.name = next.automationLevel <= 0 ? `${department.name} reference` : `${percent}% Automation${extras.length ? ` + ${extras.join(' + ')}` : ''}`
  next.rawPrompt = describeScenario(next)
  next.id = `${scenario.id}-cf`
  return next
}

export function describeScenario(scenario: Scenario): string {
  const department = getDepartment(scenario.departmentId).name
  if (scenario.automationLevel <= 0 && scenario.decision === 'Baseline') {
    return `Maintain the current ${department} operating model.`
  }
  const percent = Math.round(scenario.automationLevel * 100)
  const clauses = [`Automate ${percent}% of ${department} over the next ${scenario.timeHorizonMonths} months.`]
  if (scenario.interventions.reskilling || scenario.reskillInvestment >= 0.55) clauses.push('Fund a reskilling program.')
  if (scenario.interventions.redeployment || scenario.redeployCapacity >= 0.6) clauses.push('Redeploy affected capacity.')
  if (scenario.interventions.roleRedesign) clauses.push('Redesign affected roles.')
  if (scenario.interventions.hiring) clauses.push('Add hiring as backfill.')
  return clauses.join(' ')
}

export function counterfactualQuestion(base: Scenario, next: Scenario): string {
  const from = Math.round(base.automationLevel * 100)
  const to = Math.round(next.automationLevel * 100)
  if (to !== from) {
    return `What happens if automation ${to > from ? 'increases' : 'decreases'} from ${from}% to ${to}%?`
  }
  if (Math.abs(next.reskillInvestment - base.reskillInvestment) >= 0.05) {
    return 'What happens if reskilling investment changes from the committed scenario?'
  }
  if (Math.abs(next.trainingCompletion - base.trainingCompletion) >= 0.02) {
    return 'What happens if training completion changes from the committed scenario?'
  }
  if (Math.abs(next.redeployCapacity - base.redeployCapacity) >= 0.05) {
    return 'What happens if redeployment capacity changes from the committed scenario?'
  }
  return 'These settings match the committed scenario.'
}

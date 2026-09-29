import { PATHWAY_META, PATHWAY_ORDER } from '../../content.ts'
import { formatNumber, signedPercent } from '../../lib/format.ts'
import type { Scenario, SimulationResult } from '../../types.ts'
import { canonicalScenarios } from '../scenario/scenarioService.ts'
import { runSimulation, withParams } from '../simulation/simulationEngine.ts'
import { analyzeStress } from '../simulation/stress.ts'
import { getDepartment, getPersona, getRole, skillName } from '../workforce/workforceService.ts'

export interface JouleContext {
  result: SimulationResult | null
}

export interface JouleAdapter {
  readonly id: 'MockJouleAdapter' | 'JouleAdapter'
  readonly connection: 'mock' | 'live'
  respond(question: string, context: JouleContext): string
}

function canonicalRuns() {
  return canonicalScenarios().map((scenario) => ({
    scenario,
    result: runSimulation(scenario),
  }))
}

function lettered() {
  const letters = ['A', 'B', 'C', 'D', 'E']
  return canonicalRuns().map((run, index) => ({ ...run, letter: letters[index] ?? '?' }))
}

function pathwayLine(result: SimulationResult): string {
  return PATHWAY_ORDER.map((key) => `${PATHWAY_META[key].label} ${formatNumber(result.pathways[key])}`).join(', ')
}

function findByLetter(token: string) {
  return lettered().find((run) => run.letter.toLowerCase() === token.toLowerCase())
}

function compareBC(): string {
  const runs = lettered()
  const b = runs.find((run) => run.letter === 'B')
  const c = runs.find((run) => run.letter === 'C')
  if (!b || !c) return 'Scenario B and Scenario C are not available in this environment.'
  return [
    `Scenario B is ${b.scenario.name}. Scenario C is ${c.scenario.name}.`,
    `Both use the same 20% Customer Support scope, so the affected population stays at ${formatNumber(b.result.affected)}.`,
    `Skill readiness is ${b.result.skillReadiness} in B and ${c.result.skillReadiness} in C. High transition risk is ${formatNumber(b.result.pathways.HIGH_TRANSITION_RISK)} in B and ${formatNumber(c.result.pathways.HIGH_TRANSITION_RISK)} in C.`,
    `Horizon productivity is ${signedPercent(b.result.productivityHorizon)} in B and ${signedPercent(c.result.productivityHorizon)} in C. Near-term productivity is ${signedPercent(b.result.productivityNearTerm)} in B and ${signedPercent(c.result.productivityNearTerm)} in C.`,
    `C assumes training completion of ${Math.round(c.scenario.trainingCompletion * 100)}% and a higher reskilling investment. The model does not estimate program cost.`,
    'These are trade-offs. Simulynx does not rank the scenarios.',
  ].join(' ')
}

function automationShift(context: JouleContext, percent: number): string {
  if (!context.result) return 'There is no committed simulation to vary.'
  const next = withParams(context.result.scenario, { automationLevel: percent / 100 })
  const varied = runSimulation(next)
  const base = context.result
  return [
    `Against the committed scenario (${base.scenario.name}), ${percent}% automation ${percent > Math.round(base.scenario.automationLevel * 100) ? 'increases' : 'reduces'} the affected population from ${formatNumber(base.affected)} to ${formatNumber(varied.affected)}.`,
    `Reskilling pathways move from ${formatNumber(base.reskillDemand)} to ${formatNumber(varied.reskillDemand)}. Redeployment pathways move from ${formatNumber(base.redeployDemand)} to ${formatNumber(varied.redeployDemand)}.`,
    `High transition risk moves from ${formatNumber(base.pathways.HIGH_TRANSITION_RISK)} to ${formatNumber(varied.pathways.HIGH_TRANSITION_RISK)}. Transition risk is ${base.transitionRisk} in the committed run and ${varied.transitionRisk} at ${percent}%.`,
    `Skill readiness moves from ${base.skillReadiness} to ${varied.skillReadiness}. Horizon productivity moves from ${signedPercent(base.productivityHorizon)} to ${signedPercent(varied.productivityHorizon)}.`,
    'This is a counterfactual model estimate from the same engine. It is not a new committed run until you stage it in Scenario Studio.',
  ].join(' ')
}

function risks(context: JouleContext): string {
  if (!context.result) return 'Run a simulation before asking about risk.'
  const result = context.result
  const stress = analyzeStress(result.scenario, result.generatedAt)
  const top = stress[0]
  return [
    `In ${result.scenario.name}, transition risk is ${result.transitionRisk} (model score ${result.riskScore}). ${result.riskDriver}`,
    `High transition risk covers ${formatNumber(result.pathways.HIGH_TRANSITION_RISK)} of ${formatNumber(result.affected)} affected personas. Additional intervention covers ${formatNumber(result.pathways.ADDITIONAL_INTERVENTION)}.`,
    `Near-term productivity is ${signedPercent(result.productivityNearTerm)}. At month ${result.scenario.timeHorizonMonths} it is ${signedPercent(result.productivityHorizon)}.`,
    top
      ? `The sharpest stress on this run is: ${top.title} Measured sensitivity is ${top.sensitivity}. ${top.effect}`
      : '',
    'These are simulated risks under stated assumptions, not observed outcomes.',
  ]
    .filter(Boolean)
    .join(' ')
}

function skills(context: JouleContext): string {
  if (!context.result) return 'Run a simulation before asking about skills.'
  const result = context.result
  const gaps = new Map<string, number>()
  for (const outcome of result.personaOutcomes) {
    if (outcome.skillGapLabel === 'None modeled') continue
    gaps.set(outcome.skillGapLabel, (gaps.get(outcome.skillGapLabel) ?? 0) + 1)
  }
  const ranked = [...gaps.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const gapText = ranked.length
    ? ranked.map(([name, count]) => `${name} (${count} representative personas)`).join(', ')
    : 'no skill gaps on the representative personas in scope'
  return [
    `For ${getDepartment(result.scenario.departmentId).name}, the model shifts current skills (${result.skillTransition.current.join(', ')}) toward future skills (${result.skillTransition.future.join(', ')}).`,
    `In the representative set, the gaps that appear most often are: ${gapText}.`,
    `Model-estimated skill readiness for this run is ${result.skillReadiness}. Reskilling pathways: ${formatNumber(result.reskillDemand)}.`,
  ].join(' ')
}

function affected(context: JouleContext): string {
  if (!context.result) return 'Run a simulation before asking who is affected.'
  const result = context.result
  const department = getDepartment(result.scenario.departmentId).name
  const counts = { origin: 0, enabling: 0, receiving: 0 }
  for (const outcome of result.personaOutcomes) counts[outcome.scope] += 1
  const rows = result.departmentImpact.map((row) => `${row.name} ${formatNumber(row.affected)}`).join('; ')
  return [
    `${formatNumber(result.affected)} synthetic workforce personas are in scope for ${result.scenario.name}. The direct ${Math.round(result.scenario.automationLevel * 100)}% share of ${department} is ${formatNumber(result.directScope)} modeled positions before adjacent exposure.`,
    `The scaled department split is: ${rows || 'none'}.`,
    `The representative table holds ${result.personaOutcomes.length} personas: ${counts.origin} in the target department, ${counts.enabling} enabling, ${counts.receiving} receiving.`,
    'A persona is in scope because their role sits in the target department, on an enabling path (technology, learning, mobility), or on a receiving path linked from the workforce graph.',
  ].join(' ')
}

function redeploy(context: JouleContext): string {
  if (!context.result) return 'Run a simulation before asking about redeployment.'
  const result = context.result
  const moves = result.personaOutcomes.filter((outcome) => outcome.pathway === 'REDEPLOY' || outcome.scope === 'receiving')
  const lines = moves.slice(0, 6).map((outcome) => {
    const persona = getPersona(outcome.personaId)
    const role = persona ? getRole(persona.roleId)?.name : outcome.personaId
    const target = outcome.targetRoleId ? getRole(outcome.targetRoleId)?.name : null
    return target ? `${outcome.personaId} (${role}) → ${target}` : `${outcome.personaId} (${role}) is ${outcome.scope}`
  })
  const receiving = result.departmentImpact.find((row) => row.kind === 'receiving')
  return [
    `The scaled model estimates ${formatNumber(result.redeployDemand)} redeployment pathways.`,
    receiving ? `${receiving.name}: ${receiving.narrative}` : '',
    lines.length ? `Representative links: ${lines.join('; ')}.` : 'No representative redeployment links are in scope.',
    'A pathway is a simulated category, not a placement.',
  ]
    .filter(Boolean)
    .join(' ')
}

function assumptions(context: JouleContext): string {
  if (!context.result) return 'Run a simulation before asking about assumptions.'
  const stress = analyzeStress(context.result.scenario, context.result.generatedAt)
  const ranked = stress.map((item) => `${item.title} Sensitivity ${item.sensitivity}, severity ${item.severity}.`).join(' ')
  return `The highest-sensitivity challenges for ${context.result.scenario.name}, measured by re-running the engine: ${ranked} The stress test changes the pathway mix more often than the number of people in scope.`
}

function personaAnswer(id: string, context: JouleContext): string {
  const persona = getPersona(id.toUpperCase())
  if (!persona) return `${id.toUpperCase()} is not in the representative synthetic workforce.`
  const role = getRole(persona.roleId)?.name ?? persona.roleId
  const department = getDepartment(persona.departmentId).name
  const gaps = persona.skillGapIds.map((skillId) => skillName(skillId))
  const outcome = context.result?.personaOutcomes.find((item) => item.personaId === persona.personaId)
  const base = `${persona.personaId} is a synthetic ${role} in ${department}. Career stage ${persona.careerStage}. Learning capacity ${persona.learningCapacity}. Mobility ${persona.mobilityPotential}. Modeled skill gaps: ${gaps.join(', ') || 'none'}.`
  if (!outcome) {
    return `${base} This persona is not in the affected scope of the committed scenario.`
  }
  const target = outcome.targetRoleId ? getRole(outcome.targetRoleId)?.name : null
  return `${base} Simulated pathway: ${outcome.simulatedPathwayLabel}. Transition score ${outcome.transitionScore}, a model estimate, not a performance rating. ${target ? `Modeled destination: ${target}. ` : ''}${outcome.rationale}`
}

function noRecommendation(context: JouleContext): string {
  const name = context.result?.scenario.name ?? 'the current scenario'
  return `I will not choose a workforce decision for ${name}. The committed run, the comparison set, and the stress test are evidence for a person to weigh. Program cost, employee relations, and customer commitments are outside this model.`
}

function limits(): string {
  return 'This simulation does not know live SAP data, individual performance, compensation, or protected personal characteristics. Personas are synthetic. Results are model estimates, not predictions. Accessibility notes are work-design constraints and are not scored. The human decision is not made here.'
}

function fallback(context: JouleContext): string {
  if (!context.result) {
    return 'There is no committed simulation yet. Interpret a decision in Scenario Studio, build it, and run it. I will answer from that result only.'
  }
  const result = context.result
  return `I can answer from the committed simulation, ${result.scenario.name}. Affected population ${formatNumber(result.affected)}. Pathways: ${pathwayLine(result)}. Ask about scope, skill gaps, redeployment, productivity, assumptions, or the difference between Scenario B and Scenario C. I will not invent a recommendation or a figure that is not in this run.`
}

export function answerQuestion(question: string, context: JouleContext): string {
  const q = question.toLowerCase().trim()
  if (!q) return 'Ask a question about the active simulation.'
  const personaMatch = q.match(/p-\d{3,5}/i)
  if (personaMatch) return personaAnswer(personaMatch[0], context)
  if (/does not know|don't know|do not know|limitation|what .* not know|cannot know/.test(q)) return limits()
  if (/recommend|what should (we|i)|best option|best scenario|decide for me|which (one|scenario) should/.test(q)) return noRecommendation(context)
  if (/scenario b.*scenario c|between b and c|differ|difference|compare/.test(q)) return compareBC()
  const letter = q.match(/scenario ([a-e])\b/)
  if (letter) {
    const run = findByLetter(letter[1] ?? '')
    if (!run) return 'That comparison letter is not in the canonical set.'
    return `Scenario ${run.letter} is ${run.scenario.name}. Affected ${formatNumber(run.result.affected)}. Skill readiness ${run.result.skillReadiness}. Transition risk ${run.result.transitionRisk}. Horizon productivity ${signedPercent(run.result.productivityHorizon)}. Pathways: ${pathwayLine(run.result)}.`
  }
  if (/reduc.*10|to 10%|10% automation|lower automation to 10/.test(q)) return automationShift(context, 10)
  if (/to 30%|30% automation|increase automation to 30|from 20% to 30%/.test(q)) return automationShift(context, 30)
  if (/assum|sensitiv|stress|what could go wrong|challenge/.test(q)) return assumptions(context)
  if (/redeploy|receiving/.test(q)) return redeploy(context)
  if (/skill|gap|reskill/.test(q) && /gap|skill|transition|future/.test(q)) return skills(context)
  if (/reskill/.test(q)) return skills(context)
  if (/why.*affect|who is affect|affected|in scope|which personas/.test(q)) return affected(context)
  if (/productiv/.test(q)) {
    if (!context.result) return 'Run a simulation before asking about productivity.'
    return `Productivity for ${context.result.scenario.name} is a model estimate: ${signedPercent(context.result.productivityNearTerm)} in the near term and ${signedPercent(context.result.productivityHorizon)} at month ${context.result.scenario.timeHorizonMonths}. It is not a forecast of revenue or service level.`
  }
  if (/risk/.test(q)) return risks(context)
  if (/sap|hana|live system|connected/.test(q)) {
    return 'This prototype uses mock adapters. It is not connected to SAP HANA Cloud, SAP Build Process Automation, Joule, or SAP Analytics Cloud. The workforce is the local Demo Enterprise synthetic dataset.'
  }
  return fallback(context)
}

export class MockJouleAdapter implements JouleAdapter {
  readonly id = 'MockJouleAdapter' as const
  readonly connection = 'mock' as const

  respond(question: string, context: JouleContext): string {
    return answerQuestion(question, context)
  }
}

export const jouleAdapter: JouleAdapter = new MockJouleAdapter()

export const JOULE_SUGGESTIONS = [
  'Why are these employees affected?',
  'What are the main skill gaps?',
  'Show me potential redeployment paths.',
  'What changes if we reduce automation to 10%?',
  'Which assumptions have the highest sensitivity?',
  'Explain the difference between Scenario B and Scenario C.',
  'What are the main risks?',
]

export function jouleIntro(scenario: Scenario | null): string {
  if (!scenario) {
    return 'I answer from the simulation in this environment. Run a scenario and I will stay inside that result.'
  }
  return `I am using the committed simulation “${scenario.name}” for Demo Enterprise. Ask about scope, skills, redeployment, assumptions, or scenario differences. I will not invent figures or recommend a decision.`
}

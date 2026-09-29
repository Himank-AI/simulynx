import { PERSONAS } from '../src/data/personas.ts'
import { DEPARTMENTS, ORGANIZATION } from '../src/data/organization.ts'
import { ROLES } from '../src/data/roles.ts'
import { SKILLS } from '../src/data/skills.ts'
import { PATHWAY_ORDER } from '../src/content.ts'
import { canonicalScenarios, extraScenarios } from '../src/services/scenario/scenarioService.ts'
import { runSimulation } from '../src/services/simulation/simulationEngine.ts'
import { analyzeStress } from '../src/services/simulation/stress.ts'
import { answerQuestion } from '../src/services/joule/jouleService.ts'
import { getPersona, getRole, getSkill } from '../src/services/workforce/workforceService.ts'

const errors: string[] = []
const fail = (message: string) => errors.push(message)

const headcount = DEPARTMENTS.reduce((sum, department) => sum + department.headcount, 0)
const modelCount = DEPARTMENTS.reduce((sum, department) => sum + department.personaModelCount, 0)
if (headcount !== ORGANIZATION.workforce) fail(`headcount ${headcount} != ${ORGANIZATION.workforce}`)
if (modelCount !== ORGANIZATION.digitalPersonas) fail(`persona model ${modelCount} != ${ORGANIZATION.digitalPersonas}`)
if (PERSONAS.length < 30 || PERSONAS.length > 50) fail(`persona count ${PERSONAS.length}`)

const ids = new Set<string>()
for (const persona of PERSONAS) {
  if (ids.has(persona.personaId)) fail(`duplicate ${persona.personaId}`)
  ids.add(persona.personaId)
  if (!getRole(persona.roleId)) fail(`${persona.personaId} missing role ${persona.roleId}`)
  if (!DEPARTMENTS.some((department) => department.id === persona.departmentId)) fail(`${persona.personaId} missing department`)
  if (persona.organizationalTenureYears > persona.experienceYears) fail(`${persona.personaId} tenure > experience`)
  for (const skill of persona.currentSkills) if (!getSkill(skill.skillId)) fail(`${persona.personaId} bad skill ${skill.skillId}`)
  for (const skillId of [...persona.skillGapIds, ...persona.emergingSkillIds]) {
    if (!getSkill(skillId)) fail(`${persona.personaId} bad gap/emerging ${skillId}`)
  }
  for (const roleId of persona.potentialTransitionRoleIds) if (!getRole(roleId)) fail(`${persona.personaId} bad transition ${roleId}`)
  if (persona.managerPersonaId && !PERSONAS.some((item) => item.personaId === persona.managerPersonaId)) {
    fail(`${persona.personaId} missing manager ${persona.managerPersonaId}`)
  }
  for (const collaborator of persona.collaborationPersonaIds) {
    if (!PERSONAS.some((item) => item.personaId === collaborator)) fail(`${persona.personaId} missing collaborator ${collaborator}`)
  }
}

const hero = getPersona('P-1042')
if (!hero) fail('missing P-1042')
else {
  if (getRole(hero.roleId)?.name !== 'Customer Support Specialist') fail('P-1042 role')
  if (hero.experienceYears !== 4 || hero.workload !== 78 || hero.learningCapacity !== 'High' || hero.mobilityPotential !== 'Medium') {
    fail('P-1042 attributes')
  }
  if (!hero.skillGapIds.includes('sk-ai-support')) fail('P-1042 gap')
}

const runs = [...canonicalScenarios(), ...extraScenarios()].map((scenario) => ({
  scenario,
  result: runSimulation(scenario),
}))

for (const run of runs) {
  const again = runSimulation(run.scenario)
  const sum = PATHWAY_ORDER.reduce((total, key) => total + run.result.pathways[key], 0)
  if (sum !== run.result.affected) fail(`${run.scenario.id} pathways ${sum} != affected ${run.result.affected}`)
  if (again.affected !== run.result.affected || again.riskScore !== run.result.riskScore) fail(`${run.scenario.id} not deterministic`)
  const deptSum = run.result.departmentImpact.reduce((total, row) => total + row.affected, 0)
  if (deptSum !== run.result.affected) fail(`${run.scenario.id} departments ${deptSum} != ${run.result.affected}`)
}

const byId = Object.fromEntries(runs.map((run) => [run.scenario.id, run.result]))
const auto20 = byId['auto-20']
const reskill = byId['auto-20-reskill']
const redeploy = byId['auto-20-redeploy']
const auto10 = byId['auto-10']
const baseline = byId['baseline']
if (!auto20 || !reskill || !redeploy || !auto10 || !baseline) fail('missing canonical results')
else {
  if (auto20.affected !== 1842) fail(`auto-20 affected ${auto20.affected}`)
  if (baseline.affected !== 0) fail(`baseline affected ${baseline.affected}`)
  if (!(auto10.affected < auto20.affected)) fail('10% should affect fewer')
  if (!(reskill.pathways.HIGH_TRANSITION_RISK < auto20.pathways.HIGH_TRANSITION_RISK)) fail('reskill should lower high risk')
  if (!(reskill.skillReadiness > auto20.skillReadiness)) fail('reskill should raise readiness')
  if (!(redeploy.pathways.REDEPLOY > auto20.pathways.REDEPLOY)) fail('redeploy should raise redeploy pathways')
  if (auto20.transitionRisk === 'Low') fail('auto-20 risk unexpectedly low')
  const heroOutcome = auto20.personaOutcomes.find((item) => item.personaId === 'P-1042')
  if (!heroOutcome) fail('P-1042 not in auto-20 scope')
  else if (heroOutcome.pathway !== 'RESKILL') fail(`P-1042 pathway ${heroOutcome.pathway}`)
}

const stress = analyzeStress(canonicalScenarios()[1]!)
if (stress.length !== 6) fail('expected 6 stress cases')
if (!stress.some((item) => item.sensitivity === 'High')) fail('expected a high-sensitivity stress case')
if (!stress.some((item) => item.sensitivity === 'Medium')) fail('expected a medium-sensitivity stress case')

const sample = auto20 ? answerQuestion('What are the main risks?', { result: auto20 }) : ''
if (/I will not invent/.test(sample) && sample.length < 40) fail('risk answer fell through')
if (sample && !sample.includes(String(auto20?.transitionRisk))) fail('risk answer missing level')

for (const run of runs) {
  console.log(
    [
      run.scenario.id.padEnd(18),
      `aff ${String(run.result.affected).padStart(5)}`,
      `risk ${run.result.transitionRisk.padEnd(9)} ${String(run.result.riskScore).padStart(2)}`,
      `ready ${String(run.result.skillReadiness).padStart(2)}`,
      `near ${run.result.productivityNearTerm.toFixed(1).padStart(5)}`,
      `hor ${run.result.productivityHorizon.toFixed(1).padStart(5)}`,
      PATHWAY_ORDER.map((key) => `${key.slice(0, 3)} ${run.result.pathways[key]}`).join(' '),
      `people ${run.result.personaOutcomes.length}`,
    ].join(' | '),
  )
}

if (auto20) {
  const mix = new Map<string, number>()
  for (const outcome of auto20.personaOutcomes) mix.set(outcome.pathway, (mix.get(outcome.pathway) ?? 0) + 1)
  console.log('sample', Object.fromEntries(mix))
  console.log(
    stress
      .map(
        (item) =>
          `${item.sensitivity}/${item.severity} hr ${item.highRiskDelta} ready ${item.readinessDelta} prod ${item.productivityDelta} risk ${item.result.riskScore} :: ${item.title}`,
      )
      .join('\n'),
  )
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('ok', PERSONAS.length, 'personas', ROLES.length, 'roles', SKILLS.length, 'skills')

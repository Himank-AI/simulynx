import cds from '@sap/cds'
import { MODEL_LIMITS, PATHWAY_META, PATHWAY_ORDER } from '../engine/content.ts'
import type { Pathway, PersonaOutcome, SimulationResult } from '../engine/types.ts'
import { toScenario } from './scenario-record.ts'
import { asIso, asNumber } from './values.ts'

export async function activeRunId(): Promise<string | null> {
  const row = await cds.run(SELECT.one.from('simulynx.SimulationRuns').where({ active: true }))
  return row?.ID ?? null
}

export async function hydrateResult(runId: string): Promise<SimulationResult> {
  const run = await cds.run(SELECT.one.from('simulynx.SimulationRuns').where({ ID: runId }))
  if (!run) throw Object.assign(new Error(`Simulation run ${runId} was not found.`), { status: 404 })
  const scenario = await cds.run(SELECT.one.from('simulynx.Scenarios').where({ ID: run.scenario_ID }))
  if (!scenario) throw new Error(`Scenario ${run.scenario_ID} was not found.`)

  const outcomes = await cds.run(SELECT.from('simulynx.PersonaOutcomes').where({ run_ID: runId }))
  const impacts = await cds.run(SELECT.from('simulynx.DepartmentImpacts').where({ run_ID: runId }))
  const pathwayRows = await cds.run(SELECT.from('simulynx.PathwayCounts').where({ run_ID: runId }))
  const assumptions = await cds.run(SELECT.from('simulynx.ScenarioAssumptions').where({ scenario_ID: run.scenario_ID }))
  const shifts = await cds.run(SELECT.from('simulynx.SkillTransitions').where({ run_ID: runId }))

  const pathways = Object.fromEntries(PATHWAY_ORDER.map((pathway) => [pathway, 0])) as Record<Pathway, number>
  for (const row of pathwayRows) {
    pathways[row.pathway as Pathway] = asNumber(row.count)
  }

  const ordered = (side: string) =>
    shifts
      .filter((row: { side: string }) => row.side === side)
      .sort((left: { position: number }, right: { position: number }) => asNumber(left.position) - asNumber(right.position))
      .map((row: { skillName: string }) => row.skillName)

  return {
    id: run.ID,
    generatedAt: asIso(run.completedAt),
    scenario: toScenario(scenario),
    affected: asNumber(run.affected),
    directScope: asNumber(run.directScope),
    pathways,
    productivityNearTerm: asNumber(run.productivityNearTerm),
    productivityHorizon: asNumber(run.productivityHorizon),
    skillReadiness: asNumber(run.skillReadiness),
    transitionRisk: run.transitionRisk,
    riskScore: asNumber(run.riskScore),
    riskDriver: run.riskDriver,
    skillTransition: { current: ordered('current'), future: ordered('future') },
    departmentImpact: impacts.map((row: Record<string, unknown>) => ({
      key: String(row.impactKey),
      name: String(row.name),
      kind: row.kind as 'origin' | 'enabling' | 'receiving',
      affected: asNumber(row.affected),
      narrative: String(row.narrative),
      capacityStrain: row.capacityStrain as 'Low' | 'Medium' | 'High',
      netLoad: asNumber(row.netLoad),
    })),
    personaOutcomes: outcomes.map(
      (row: Record<string, unknown>): PersonaOutcome => ({
        personaId: String(row.persona_ID),
        scope: row.scope as PersonaOutcome['scope'],
        pathway: row.pathway as PersonaOutcome['pathway'],
        simulatedPathwayLabel: String(row.pathwayLabel),
        transitionScore: asNumber(row.transitionScore),
        skillGapLabel: String(row.skillGapLabel),
        targetRoleId: row.targetRole_ID ? String(row.targetRole_ID) : undefined,
        rationale: String(row.rationale),
      }),
    ),
    assumptions: assumptions.map((row: Record<string, unknown>) => ({
      id: String(row.assumptionId),
      statement: String(row.statement),
      sensitivity: row.sensitivity as 'Low' | 'Medium' | 'High',
      source: String(row.source),
    })),
    reskillDemand: asNumber(run.reskillDemand),
    redeployDemand: asNumber(run.redeployDemand),
    limitations: MODEL_LIMITS,
  }
}

export async function bundle(runId: string): Promise<Record<string, unknown>> {
  const result = await hydrateResult(runId)
  const header = await cds.run(SELECT.one.from('simulynx.SimulationRuns').columns('active', 'committed').where({ ID: runId }))
  const risks = await cds.run(SELECT.from('simulynx.RiskFactors').where({ run_ID: runId }))
  const metrics = await cds.run(SELECT.from('simulynx.SimulationMetrics').where({ run_ID: runId }))
  const brief = await cds.run(SELECT.one.from('simulynx.DecisionBriefs').where({ run_ID: runId }))
  const personas = await cds.run(
    SELECT.from('simulynx.Personas').columns('ID', 'role_ID', 'department_ID', 'location_ID', 'careerStage_code', 'workload', 'learningCapacity', 'mobilityPotential'),
  )
  const roles = await cds.run(SELECT.from('simulynx.Roles').columns('ID', 'name'))
  const departments = await cds.run(SELECT.from('simulynx.Departments').columns('ID', 'name', 'personaModelCount', 'headcount', 'readiness', 'riskExposure'))
  const roleName = new Map(roles.map((row: { ID: string; name: string }) => [row.ID, row.name]))
  const departmentName = new Map(departments.map((row: { ID: string; name: string }) => [row.ID, row.name]))
  const personaById = new Map(personas.map((row: { ID: string }) => [row.ID, row]))

  return {
    disclaimer: 'Simulation result — not a prediction.',
    run: {
      ID: result.id,
      affected: result.affected,
      directScope: result.directScope,
      reskillDemand: result.reskillDemand,
      redeployDemand: result.redeployDemand,
      skillReadiness: result.skillReadiness,
      transitionRisk: result.transitionRisk,
      riskScore: result.riskScore,
      riskDriver: result.riskDriver,
      productivityNearTerm: result.productivityNearTerm,
      productivityHorizon: result.productivityHorizon,
      completedAt: result.generatedAt,
      active: header?.active === true || header?.active === 1,
      committed: header?.committed === true || header?.committed === 1,
    },
    scenario: {
      ID: result.scenario.id,
      name: result.scenario.name,
      rawPrompt: result.scenario.rawPrompt,
      decision: result.scenario.decision,
      departmentId: result.scenario.departmentId,
      departmentName: departmentName.get(result.scenario.departmentId) ?? result.scenario.departmentId,
      automationLevel: result.scenario.automationLevel,
      timeHorizonMonths: result.scenario.timeHorizonMonths,
      reskilling: result.scenario.interventions.reskilling,
      redeployment: result.scenario.interventions.redeployment,
      roleRedesign: result.scenario.interventions.roleRedesign,
      hiring: result.scenario.interventions.hiring,
      reskillInvestment: result.scenario.reskillInvestment,
      trainingCompletion: result.scenario.trainingCompletion,
      redeployCapacity: result.scenario.redeployCapacity,
    },
    pathways: PATHWAY_ORDER.map((pathway) => ({
      pathway,
      label: PATHWAY_META[pathway].label,
      color: PATHWAY_META[pathway].color,
      count: result.pathways[pathway],
    })),
    outcomes: result.personaOutcomes.map((outcome) => {
      const persona = personaById.get(outcome.personaId) as Record<string, string> | undefined
      return {
        personaId: outcome.personaId,
        roleName: persona ? roleName.get(persona.role_ID) : outcome.personaId,
        departmentId: persona?.department_ID,
        departmentName: persona ? departmentName.get(persona.department_ID) : '',
        location: persona?.location_ID,
        careerStage: persona?.careerStage_code,
        workload: persona?.workload,
        learningCapacity: persona?.learningCapacity,
        mobilityPotential: persona?.mobilityPotential,
        scope: outcome.scope,
        pathway: outcome.pathway,
        pathwayLabel: outcome.simulatedPathwayLabel,
        transitionScore: outcome.transitionScore,
        skillGapLabel: outcome.skillGapLabel,
        targetRoleId: outcome.targetRoleId ?? null,
        targetRoleName: outcome.targetRoleId ? roleName.get(outcome.targetRoleId) ?? outcome.targetRoleId : null,
        rationale: outcome.rationale,
      }
    }),
    impacts: result.departmentImpact,
    assumptions: result.assumptions,
    skillTransition: result.skillTransition,
    risks: risks.map((row: Record<string, unknown>) => ({
      id: row.factorId,
      title: row.title,
      assumption: row.assumption,
      severity: row.severity,
      sensitivity: row.sensitivity,
      effect: row.effect,
      affectedDelta: asNumber(row.affectedDelta),
      highRiskDelta: asNumber(row.highRiskDelta),
      readinessDelta: asNumber(row.readinessDelta),
    })),
    metrics: metrics.map((row: Record<string, unknown>) => ({
      metric: row.metric,
      label: row.label,
      value: asNumber(row.value),
      unit: row.unit,
    })),
    departments: departments.map((row: Record<string, unknown>) => ({
      ID: row.ID,
      name: row.name,
      personaModelCount: asNumber(row.personaModelCount),
      headcount: asNumber(row.headcount),
      readiness: asNumber(row.readiness),
      riskExposure: row.riskExposure,
    })),
    limitations: result.limitations,
    brief: brief ? { ID: brief.ID, title: brief.title, body: brief.body, published: false, connected: false, adapter: brief.adapter } : null,
  }
}

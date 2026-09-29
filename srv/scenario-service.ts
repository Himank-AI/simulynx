import cds from '@sap/cds'
import { getDepartment } from './engine/catalog.ts'
import { draftToScenario, parseDecision } from './engine/scenarioService.ts'
import type { ScenarioDraft } from './engine/types.ts'
import { MockBuildProcessAutomationService } from './external/build-automation-service.ts'
import { ensureCatalog } from './lib/load-catalog.ts'
import { toScenario } from './lib/scenario-record.ts'
import { asBoolean, asNumber } from './lib/values.ts'

const workflow = new MockBuildProcessAutomationService()

function draftFromRequest(data: Record<string, unknown>, rawPrompt: string, decision: string, departmentId: string): ScenarioDraft {
  return {
    rawPrompt,
    decision: decision || 'Workforce change',
    departmentId,
    automationLevel: asNumber(data.automationLevel),
    timeHorizonMonths: asNumber(data.timeHorizonMonths, 12),
    horizonAssumed: false,
    automationAssumed: false,
    interventions: {
      reskilling: asBoolean(data.reskilling),
      redeployment: asBoolean(data.redeployment),
      roleRedesign: asBoolean(data.roleRedesign),
      hiring: asBoolean(data.hiring),
    },
    metrics: { workforceImpact: true, skills: true, mobility: true, productivity: true, risk: true },
    notes: [],
    reskillInvestment: asNumber(data.reskillInvestment),
    trainingCompletion: asNumber(data.trainingCompletion),
    redeployCapacity: asNumber(data.redeployCapacity),
  }
}

function assertScenario(draft: ScenarioDraft): void {
  if (!draft.departmentId) throw Object.assign(new Error('Choose a target department before building the scenario.'), { status: 400 })
  if (draft.automationLevel === null || draft.automationLevel < 0 || draft.automationLevel > 1) {
    throw Object.assign(new Error('Automation magnitude must be between 0 and 100 percent.'), { status: 400 })
  }
  if (draft.timeHorizonMonths < 1 || draft.timeHorizonMonths > 60) {
    throw Object.assign(new Error('Timeline must be between 1 and 60 months.'), { status: 400 })
  }
  for (const [label, value] of [
    ['Reskilling investment', draft.reskillInvestment],
    ['Training completion', draft.trainingCompletion],
    ['Redeployment capacity', draft.redeployCapacity],
  ] as const) {
    if (value < 0 || value > 1) throw Object.assign(new Error(`${label} must be between 0 and 1.`), { status: 400 })
  }
}

async function scenarioPayload(id: string): Promise<string> {
  const row = await cds.run(SELECT.one.from('simulynx.Scenarios').where({ ID: id }))
  const scenario = toScenario(row)
  const department = getDepartment(scenario.departmentId)
  return JSON.stringify({
    ID: scenario.id,
    name: scenario.name,
    rawPrompt: scenario.rawPrompt,
    decision: scenario.decision,
    departmentId: scenario.departmentId,
    departmentName: department.name,
    magnitude: scenario.automationLevel,
    automationLevel: scenario.automationLevel,
    timeHorizonMonths: scenario.timeHorizonMonths,
    interventions: scenario.interventions,
    reskillInvestment: scenario.reskillInvestment,
    trainingCompletion: scenario.trainingCompletion,
    redeployCapacity: scenario.redeployCapacity,
    status: scenario.status,
  })
}

export default class ScenarioService extends cds.ApplicationService {
  override async init(): Promise<void> {
    this.on('interpret', async (req) => {
      await ensureCatalog()
      const prompt = String(req.data.prompt ?? '')
      const draft = parseDecision(prompt)
      const departmentName = draft.departmentId ? getDepartment(draft.departmentId).name : null
      return JSON.stringify({ ...draft, departmentName, source: 'ScenarioService' })
    })

    this.on('createScenario', async (req) => {
      await ensureCatalog()
      const data = req.data as Record<string, unknown>
      const draft = draftFromRequest(data, String(data.rawPrompt ?? ''), String(data.decision ?? ''), String(data.departmentId ?? ''))
      assertScenario(draft)
      const id = `scn-${Date.now().toString(36)}`
      const scenario = draftToScenario(draft, id, new Date().toISOString())
      await cds.run(
        INSERT.into('simulynx.Scenarios').entries({
          ID: scenario.id,
          name: scenario.name,
          rawPrompt: scenario.rawPrompt,
          decision: scenario.decision,
          department_ID: scenario.departmentId,
          magnitude: scenario.automationLevel,
          automationLevel: scenario.automationLevel,
          timeHorizonMonths: scenario.timeHorizonMonths,
          reskilling: scenario.interventions.reskilling,
          redeployment: scenario.interventions.redeployment,
          roleRedesign: scenario.interventions.roleRedesign,
          hiring: scenario.interventions.hiring,
          reskillInvestment: scenario.reskillInvestment,
          trainingCompletion: scenario.trainingCompletion,
          redeployCapacity: scenario.redeployCapacity,
          metricWorkforce: true,
          metricSkills: true,
          metricMobility: true,
          metricProductivity: true,
          metricRisk: true,
          status: 'ready',
        }),
      )
      await workflow.record(scenario.id, null, 'ScenarioCreated', `Scenario “${scenario.name}” was created.`)
      return scenarioPayload(scenario.id)
    })

    this.on('updateScenario', async (req) => {
      await ensureCatalog()
      const data = req.data as Record<string, unknown>
      const id = String(data.scenarioId ?? '')
      const existing = await cds.run(SELECT.one.from('simulynx.Scenarios').where({ ID: id }))
      if (!existing) return req.reject(404, `Scenario ${id} was not found.`)
      const draft = draftFromRequest(
        data,
        existing.rawPrompt,
        existing.decision,
        existing.department_ID,
      )
      assertScenario(draft)
      const scenario = draftToScenario(draft, id, existing.createdAt ?? new Date().toISOString())
      await cds.run(
        UPDATE('simulynx.Scenarios').set({
          name: scenario.name,
          automationLevel: scenario.automationLevel,
          magnitude: scenario.automationLevel,
          timeHorizonMonths: scenario.timeHorizonMonths,
          reskilling: scenario.interventions.reskilling,
          redeployment: scenario.interventions.redeployment,
          roleRedesign: scenario.interventions.roleRedesign,
          hiring: scenario.interventions.hiring,
          reskillInvestment: scenario.reskillInvestment,
          trainingCompletion: scenario.trainingCompletion,
          redeployCapacity: scenario.redeployCapacity,
          status: 'ready',
        }).where({ ID: id }),
      )
      return scenarioPayload(id)
    })

    await super.init()
  }
}

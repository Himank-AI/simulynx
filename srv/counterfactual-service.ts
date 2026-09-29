import cds from '@sap/cds'
import { counterfactualQuestion, runSimulation, withParams } from './engine/simulationEngine.ts'
import { bundle, hydrateResult } from './lib/hydrate.ts'
import { ensureCatalog } from './lib/load-catalog.ts'
import { persistRun } from './lib/persist.ts'
import { asNumber } from './lib/values.ts'

const BANDS = { Low: 0.22, Medium: 0.55, High: 0.84 } as const
const REDEPLOY = { Low: 0.25, Medium: 0.5, High: 0.84 } as const

function band(value: unknown, label: string): 'Low' | 'Medium' | 'High' {
  const text = String(value ?? 'Medium')
  if (text === 'Low' || text === 'Medium' || text === 'High') return text
  throw Object.assign(new Error(`${label} must be Low, Medium, or High.`), { status: 400 })
}

export default class CounterfactualService extends cds.ApplicationService {
  override async init(): Promise<void> {
    this.on('runAlternative', async (req) => {
      await ensureCatalog()
      const data = req.data as Record<string, unknown>
      const baseId = String(data.runId ?? '')
      const base = await hydrateResult(baseId)
      const automationPercent = Math.round(asNumber(data.automationPercent, 20))
      const trainingPercent = Math.round(asNumber(data.trainingPercent, 70))
      if (automationPercent < 0 || automationPercent > 50) return req.reject(400, 'Automation must be between 0 and 50 percent.')
      if (trainingPercent < 50 || trainingPercent > 100) return req.reject(400, 'Training completion must be between 50 and 100 percent.')
      const redeployCapacity = band(data.redeployCapacity, 'Redeployment capacity')
      const reskillInvestment = band(data.reskillInvestment, 'Reskilling investment')

      const varied = withParams(base.scenario, {
        automationLevel: automationPercent / 100,
        trainingCompletion: trainingPercent / 100,
        redeployCapacity: REDEPLOY[redeployCapacity],
        reskillInvestment: BANDS[reskillInvestment],
      })
      const scenarioId = `cf-${base.scenario.id}-a${automationPercent}-t${trainingPercent}-d${redeployCapacity}-r${reskillInvestment}`.slice(0, 40)
      varied.id = scenarioId
      const existing = await cds.run(SELECT.one.from('simulynx.Scenarios').columns('ID').where({ ID: scenarioId }))
      const entry = {
        name: varied.name,
        rawPrompt: varied.rawPrompt,
        decision: varied.decision,
        department_ID: varied.departmentId,
        magnitude: varied.automationLevel,
        automationLevel: varied.automationLevel,
        timeHorizonMonths: varied.timeHorizonMonths,
        reskilling: varied.interventions.reskilling,
        redeployment: varied.interventions.redeployment,
        roleRedesign: varied.interventions.roleRedesign,
        hiring: varied.interventions.hiring,
        reskillInvestment: varied.reskillInvestment,
        trainingCompletion: varied.trainingCompletion,
        redeployCapacity: varied.redeployCapacity,
        metricWorkforce: true,
        metricSkills: true,
        metricMobility: true,
        metricProductivity: true,
        metricRisk: true,
        status: 'ready',
      }
      if (existing) await cds.run(UPDATE('simulynx.Scenarios').set(entry).where({ ID: scenarioId }))
      else await cds.run(INSERT.into('simulynx.Scenarios').entries({ ID: scenarioId, ...entry }))

      const generatedAt = base.generatedAt
      const result = runSimulation(varied, {}, { id: scenarioId, generatedAt })
      await persistRun(result, { id: scenarioId, committed: false, active: false, startedAt: generatedAt })

      const question = counterfactualQuestion(base.scenario, varied)
      await cds.run(DELETE.from('simulynx.CounterfactualScenarios').where({ ID: scenarioId }))
      await cds.run(
        INSERT.into('simulynx.CounterfactualScenarios').entries({
          ID: scenarioId,
          run_ID: baseId,
          alternativeRun_ID: scenarioId,
          question,
          automationPercent,
          trainingPercent,
          redeployCapacity,
          reskillInvestment,
          affected: result.affected,
          reskillDemand: result.reskillDemand,
          redeployDemand: result.redeployDemand,
          highTransitionRisk: result.pathways.HIGH_TRANSITION_RISK,
          skillReadiness: result.skillReadiness,
          transitionRisk: result.transitionRisk,
          riskScore: result.riskScore,
          productivityNearTerm: result.productivityNearTerm,
          productivityHorizon: result.productivityHorizon,
        }),
      )
      const comparisonId = `cmp-${scenarioId}`.slice(0, 40)
      await cds.run(DELETE.from('simulynx.ScenarioComparisons').where({ ID: comparisonId }))
      await cds.run(
        INSERT.into('simulynx.ScenarioComparisons').entries({
          ID: comparisonId,
          title: question,
          leftRun_ID: baseId,
          rightRun_ID: scenarioId,
          note: 'Counterfactual comparison. Simulation result — not a prediction.',
          createdAt: new Date().toISOString(),
        }),
      )

      const alternative = await bundle(scenarioId)
      return JSON.stringify({
        question,
        disclaimer: 'Simulation result — not a prediction.',
        base: {
          affected: base.affected,
          reskillDemand: base.reskillDemand,
          redeployDemand: base.redeployDemand,
          highTransitionRisk: base.pathways.HIGH_TRANSITION_RISK,
          skillReadiness: base.skillReadiness,
          transitionRisk: base.transitionRisk,
          riskScore: base.riskScore,
          productivityNearTerm: base.productivityNearTerm,
          productivityHorizon: base.productivityHorizon,
          name: base.scenario.name,
        },
        alternative,
      })
    })

    await super.init()
  }
}

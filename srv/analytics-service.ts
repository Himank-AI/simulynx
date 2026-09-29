import cds from '@sap/cds'
import { MockAnalyticsCloudService } from './external/analytics-cloud-service.ts'
import { MockHanaService } from './external/hana-service.ts'
import { MockJouleService } from './external/joule-service.ts'
import { MockBuildProcessAutomationService } from './external/build-automation-service.ts'
import { bundle, hydrateResult } from './lib/hydrate.ts'
import { ensureCatalog } from './lib/load-catalog.ts'
import { asNumber } from './lib/values.ts'

const analytics = new MockAnalyticsCloudService()
const hana = new MockHanaService()
const joule = new MockJouleService()
const workflow = new MockBuildProcessAutomationService()

export default class AnalyticsService extends cds.ApplicationService {
  override async init(): Promise<void> {
    this.on('comparison', async () => {
      const runs = await cds.run(
        SELECT.from('simulynx.SimulationRuns')
          .columns(
            'ID',
            'scenario_ID',
            'affected',
            'reskillDemand',
            'redeployDemand',
            'skillReadiness',
            'transitionRisk',
            'riskScore',
            'productivityNearTerm',
            'productivityHorizon',
            'committed',
            'active',
            'completedAt',
          )
          .where({ committed: true })
          .orderBy('completedAt desc'),
      )
      const scenarios = await cds.run(SELECT.from('simulynx.Scenarios').columns('ID', 'name', 'decision', 'department_ID', 'automationLevel'))
      const byId = new Map(scenarios.map((row: { ID: string }) => [row.ID, row]))
      const pathways = await cds.run(SELECT.from('simulynx.PathwayCounts'))
      return JSON.stringify({
        disclaimer: 'Simulation result — not a prediction.',
        connected: false,
        adapter: analytics.id,
        runs: runs.map((run: Record<string, unknown>) => {
          const scenario = byId.get(String(run.scenario_ID)) as { name?: string; decision?: string; automationLevel?: unknown } | undefined
          return {
            ID: run.ID,
            scenarioId: run.scenario_ID,
            name: scenario?.name ?? run.scenario_ID,
            decision: scenario?.decision,
            automationLevel: scenario ? asNumber(scenario.automationLevel) : null,
            affected: asNumber(run.affected),
            reskillDemand: asNumber(run.reskillDemand),
            redeployDemand: asNumber(run.redeployDemand),
            skillReadiness: asNumber(run.skillReadiness),
            transitionRisk: run.transitionRisk,
            riskScore: asNumber(run.riskScore),
            productivityNearTerm: asNumber(run.productivityNearTerm),
            productivityHorizon: asNumber(run.productivityHorizon),
            active: run.active === true || run.active === 1,
            completedAt: run.completedAt,
            pathways: pathways
              .filter((row: { run_ID: string }) => row.run_ID === run.ID)
              .map((row: { pathway: string; label: string; count: unknown }) => ({
                pathway: row.pathway,
                label: row.label,
                count: asNumber(row.count),
              })),
          }
        }),
      })
    })

    this.on('decisionBrief', async (req) => {
      const runId = String(req.data.runId ?? '')
      const brief = await cds.run(SELECT.one.from('simulynx.DecisionBriefs').where({ run_ID: runId }))
      if (!brief) return req.reject(404, 'No decision brief is stored for that simulation.')
      return JSON.stringify({
        ID: brief.ID,
        title: brief.title,
        body: brief.body,
        adapter: brief.adapter,
        published: false,
        connected: false,
        note: 'Prepared locally for a future SAP Analytics Cloud story. Not published.',
      })
    })

    this.on('stress', async (req) => {
      await ensureCatalog()
      const runId = String(req.data.runId ?? '')
      const result = await hydrateResult(runId)
      const rows = await cds.run(SELECT.from('simulynx.RiskFactors').where({ run_ID: runId }))
      return JSON.stringify({
        disclaimer: 'Simulation result — not a prediction.',
        scenario: result.scenario.name,
        factors: rows.map((row: Record<string, unknown>) => ({
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
      })
    })

    this.on('adapters', () => {
      const contract = analytics.story({
        id: 'contract',
        pathways: {
          RESKILL: 0,
          REDEPLOY: 0,
          ROLE_REDESIGN: 0,
          UNCHANGED: 0,
          ADDITIONAL_INTERVENTION: 0,
          HIGH_TRANSITION_RISK: 0,
        },
        departmentImpact: [],
      } as never)
      return JSON.stringify({
        joule: { id: joule.id, connected: joule.connected, note: 'Questions are answered from the persisted simulation by MockJouleService.' },
        buildProcessAutomation: {
          id: workflow.id,
          connected: workflow.connected,
          steps: workflow.steps,
          note: 'Scenario and simulation steps are recorded locally. SAP Build Process Automation is not connected.',
        },
        analyticsCloud: {
          id: analytics.id,
          connected: analytics.connected,
          published: false,
          contract: ['workforce affected', 'reskilling demand', 'redeployment demand', 'skill gaps', 'mobility pathways', 'department impact', 'transition risk', 'scenario comparisons', 'counterfactual results'],
          sampleStory: contract.storyId,
          note: contract.note,
        },
        hanaCloud: { id: hana.id, system: hana.system, connected: hana.connected, runtime: hana.runtime, note: hana.describe() },
      })
    })

    await super.init()
  }
}

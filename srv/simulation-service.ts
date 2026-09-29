import cds from '@sap/cds'
import { runSimulation } from './engine/simulationEngine.ts'
import { MockBuildProcessAutomationService } from './external/build-automation-service.ts'
import { activeRunId, bundle } from './lib/hydrate.ts'
import { ensureCatalog } from './lib/load-catalog.ts'
import { persistRun } from './lib/persist.ts'
import { toScenario } from './lib/scenario-record.ts'

const workflow = new MockBuildProcessAutomationService()

export default class SimulationService extends cds.ApplicationService {
  override async init(): Promise<void> {
    this.on('execute', async (req) => {
      await ensureCatalog()
      const scenarioId = String(req.data.scenarioId ?? '')
      const row = await cds.run(SELECT.one.from('simulynx.Scenarios').where({ ID: scenarioId }))
      if (!row) return req.reject(404, `Scenario ${scenarioId} was not found.`)
      const scenario = toScenario(row)
      const startedAt = new Date().toISOString()
      const id = `run-${scenario.id}-${startedAt.replace(/\D/g, '').slice(0, 14)}`.slice(0, 40)
      await workflow.record(scenario.id, id, 'SimulationRequested', 'Simulation requested from Scenario Studio.')
      const result = runSimulation(scenario, {}, { id, generatedAt: new Date().toISOString() })
      await persistRun(result, { id, committed: true, active: true, startedAt })
      return JSON.stringify(await bundle(id))
    })

    this.on('bundle', async (req) => {
      await ensureCatalog()
      const runId = String(req.data.runId ?? '')
      if (!runId) return req.reject(400, 'A simulation run is required.')
      return JSON.stringify(await bundle(runId))
    })

    this.on('active', async () => {
      await ensureCatalog()
      const id = await activeRunId()
      if (!id) return JSON.stringify(null)
      return JSON.stringify(await bundle(id))
    })

    await super.init()
  }
}

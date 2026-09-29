import cds from '@sap/cds'
import { MockJouleService } from './external/joule-service.ts'
import { activeRunId, hydrateResult } from './lib/hydrate.ts'
import { ensureCatalog } from './lib/load-catalog.ts'

const joule = new MockJouleService()

export default class JouleService extends cds.ApplicationService {
  override async init(): Promise<void> {
    this.on('suggestions', async () => {
      const runId = await activeRunId()
      let scenarioName: string | null = null
      if (runId) {
        await ensureCatalog()
        scenarioName = (await hydrateResult(runId)).scenario.name
      }
      return JSON.stringify({
        adapter: joule.id,
        connected: false,
        intro: joule.intro(scenarioName),
        suggestions: joule.suggestions(),
      })
    })

    this.on('ask', async (req) => {
      await ensureCatalog()
      const requested = String(req.data.runId ?? '')
      const runId = requested || (await activeRunId()) || ''
      const result = runId ? await hydrateResult(runId) : null
      const answer = joule.ask(String(req.data.question ?? ''), { result })
      return JSON.stringify({
        adapter: joule.id,
        connected: false,
        runId: runId || null,
        answer,
        disclaimer: 'Simulation result — not a prediction.',
      })
    })

    await super.init()
  }
}

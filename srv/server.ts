import cds from '@sap/cds'
import { canonicalScenarios, extraScenarios } from './engine/scenarioService.ts'
import { runSimulation } from './engine/simulationEngine.ts'
import { ensureCatalog } from './lib/load-catalog.ts'
import { persistRun } from './lib/persist.ts'

cds.on('bootstrap', (app: { get: (path: string, handler: (_req: unknown, res: { redirect: (path: string) => void }) => void) => void }) => {
  app.get('/', (_req, res) => {
    res.redirect('/simulynx/webapp/index.html')
  })
})

cds.on('served', async () => {
  await ensureCatalog()
  const existing = await cds.run(SELECT.one.from('simulynx.SimulationRuns').columns('ID'))
  if (existing) return
  const scenarios = [...canonicalScenarios(), ...extraScenarios()]
  for (const scenario of scenarios) {
    const id = `run-${scenario.id}`
    const result = runSimulation(scenario, {}, { id, generatedAt: scenario.createdAt })
    await persistRun(result, {
      id,
      committed: true,
      active: scenario.id === 'auto-20',
      startedAt: scenario.createdAt,
    })
  }
  cds.log('simulynx').info(`Seeded ${scenarios.length} deterministic simulation runs.`)
})

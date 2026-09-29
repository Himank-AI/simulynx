import cds from '@sap/cds'

const STEPS = ['ScenarioCreated', 'SimulationRequested', 'SimulationExecuted', 'ResultsGenerated', 'DecisionBriefCreated'] as const
export type ProcessStep = (typeof STEPS)[number]

/**
 * Mock stand-in for SAP Build Process Automation.
 * connected is always false until a real destination is configured.
 */
export class MockBuildProcessAutomationService {
  readonly id: string = 'MockBuildProcessAutomationService'
  readonly connected = false
  readonly steps = STEPS

  async record(scenarioId: string, runId: string | null, step: ProcessStep, message: string): Promise<string> {
    const code: Record<ProcessStep, string> = {
      ScenarioCreated: 'sc',
      SimulationRequested: 'rq',
      SimulationExecuted: 'ex',
      ResultsGenerated: 'rs',
      DecisionBriefCreated: 'br',
    }
    const id = `bpa-${code[step]}-${runId ?? scenarioId}`.slice(0, 48)
    await cds.run(DELETE.from('simulynx.ProcessEvents').where({ ID: id }))
    await cds.run(
      INSERT.into('simulynx.ProcessEvents').entries({
        ID: id,
        scenario_ID: scenarioId,
        run_ID: runId,
        step,
        adapter: this.id,
        connected: false,
        message: `${message} Mock adapter only — SAP Build Process Automation is not connected.`,
        createdAt: new Date().toISOString(),
      }),
    )
    return id
  }
}

export class SapBuildProcessAutomationService extends MockBuildProcessAutomationService {
  override readonly id = 'SapBuildProcessAutomationService'
  override readonly connected = false
}

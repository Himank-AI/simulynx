import { answerQuestion, JOULE_SUGGESTIONS } from '../engine/jouleService.ts'
import type { JouleContext } from '../engine/jouleService.ts'

/**
 * Mock stand-in for SAP Joule.
 * Answers are produced from the persisted SimulationRun. This is not a live Joule connection.
 */
export class MockJouleService {
  readonly id: string = 'MockJouleService'
  readonly connected = false

  ask(question: string, context: JouleContext): string {
    return answerQuestion(question, context)
  }

  suggestions(): string[] {
    return [...JOULE_SUGGESTIONS]
  }

  intro(scenarioName: string | null): string {
    if (!scenarioName) {
      return 'Mock Joule answers from a committed simulation. Run a scenario first. SAP Joule is not connected.'
    }
    return `Mock Joule is using the committed simulation “${scenarioName}” for Demo Enterprise. Answers come from that persisted run. SAP Joule is not connected.`
  }
}

export class SapJouleService extends MockJouleService {
  override readonly id = 'SapJouleService'
  override readonly connected = false
}

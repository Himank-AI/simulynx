import { hashString } from '../../lib/format.ts'
import type { ProcessReceipt, Scenario } from '../../types.ts'

export interface ProcessAutomationAdapter {
  readonly id: 'MockBuildAutomationAdapter' | 'SapBuildAutomationAdapter'
  readonly connection: 'mock' | 'live'
  stage(scenario: Scenario, stagedAt?: string): ProcessReceipt
}

export class MockBuildAutomationAdapter implements ProcessAutomationAdapter {
  readonly id = 'MockBuildAutomationAdapter' as const
  readonly connection = 'mock' as const

  stage(scenario: Scenario, stagedAt = new Date().toISOString()): ProcessReceipt {
    const suffix = (hashString(`${scenario.departmentId}|${scenario.rawPrompt}|${scenario.automationLevel}`) % 9000) + 1000
    return {
      adapter: 'MockBuildAutomationAdapter',
      connection: 'mock',
      processId: `BPA-DEMO-${suffix}`,
      status: 'Staged locally',
      detail: 'Not submitted to SAP Build Process Automation. This receipt is produced by the mock adapter in the simulation environment.',
      stagedAt,
      scenarioId: scenario.id,
    }
  }
}

export const buildAutomationAdapter: ProcessAutomationAdapter = new MockBuildAutomationAdapter()

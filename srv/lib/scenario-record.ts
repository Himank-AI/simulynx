import type { Scenario } from '../engine/types.ts'
import { asBoolean, asIso, asNumber } from './values.ts'

export interface ScenarioRow {
  ID: string
  name: string
  rawPrompt: string
  decision: string
  department_ID: string
  targetRole_ID?: string | null
  magnitude?: unknown
  automationLevel: unknown
  timeHorizonMonths: unknown
  reskilling: unknown
  redeployment: unknown
  roleRedesign: unknown
  hiring: unknown
  reskillInvestment: unknown
  trainingCompletion: unknown
  redeployCapacity: unknown
  status: Scenario['status'] | string
  createdAt?: unknown
}

export function toScenario(row: ScenarioRow): Scenario {
  return {
    id: row.ID,
    name: row.name,
    rawPrompt: row.rawPrompt,
    decision: row.decision,
    departmentId: row.department_ID,
    automationLevel: asNumber(row.automationLevel),
    timeHorizonMonths: asNumber(row.timeHorizonMonths, 12),
    interventions: {
      reskilling: asBoolean(row.reskilling),
      redeployment: asBoolean(row.redeployment),
      roleRedesign: asBoolean(row.roleRedesign),
      hiring: asBoolean(row.hiring),
    },
    metrics: {
      workforceImpact: true,
      skills: true,
      mobility: true,
      productivity: true,
      risk: true,
    },
    reskillInvestment: asNumber(row.reskillInvestment),
    trainingCompletion: asNumber(row.trainingCompletion),
    redeployCapacity: asNumber(row.redeployCapacity),
    status: row.status === 'draft' || row.status === 'complete' ? row.status : 'ready',
    createdAt: asIso(row.createdAt),
  }
}

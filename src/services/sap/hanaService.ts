import { DEPARTMENTS, ORGANIZATION } from '../../data/organization.ts'
import { PATHWAYS } from '../../data/pathways.ts'
import { PERSONAS } from '../../data/personas.ts'
import { ROLES } from '../../data/roles.ts'
import { SKILLS } from '../../data/skills.ts'
import type { ConnectionMode, WorkforceSnapshot } from '../../types.ts'

export interface HanaAdapter {
  readonly id: 'MockHanaAdapter' | 'SapHanaAdapter'
  readonly connection: ConnectionMode
  getSnapshot(): WorkforceSnapshot
}

export class MockHanaAdapter implements HanaAdapter {
  readonly id = 'MockHanaAdapter' as const
  readonly connection = 'mock' as const

  getSnapshot(): WorkforceSnapshot {
    return {
      source: 'synthetic-local',
      system: 'SAP HANA Cloud',
      connected: false,
      note: 'Mock adapter. This snapshot is the local Demo Enterprise synthetic workforce, not a query against SAP HANA Cloud.',
      organization: ORGANIZATION,
      departments: DEPARTMENTS,
      roles: ROLES,
      personas: PERSONAS,
      skills: SKILLS,
      pathways: PATHWAYS,
    }
  }
}

export const hanaAdapter: HanaAdapter = new MockHanaAdapter()
export const workforceSnapshot = hanaAdapter.getSnapshot()

import { PATHWAY_META, PATHWAY_ORDER } from '../engine/content.ts'
import type { Pathway, SimulationResult } from '../engine/types.ts'

export interface AnalyticsContract {
  adapter: string
  connection: 'mock'
  storyId: string
  published: false
  note: string
  pathwaySeries: { key: Pathway; name: string; value: number; fill: string }[]
  departmentSeries: { name: string; affected: number }[]
}

/**
 * Data contract for a future SAP Analytics Cloud story.
 * The prototype calculates the series locally and does not publish them.
 */
export class MockAnalyticsCloudService {
  readonly id: string = 'MockAnalyticsCloudService'
  readonly connected = false

  story(result: SimulationResult): AnalyticsContract {
    return {
      adapter: this.id,
      connection: 'mock',
      storyId: `SAC-DEMO-${result.id}`,
      published: false,
      note: 'Metrics are available through the AnalyticsService OData contract. Nothing is published to SAP Analytics Cloud.',
      pathwaySeries: PATHWAY_ORDER.map((key) => ({
        key,
        name: PATHWAY_META[key].label,
        value: result.pathways[key],
        fill: PATHWAY_META[key].color,
      })),
      departmentSeries: result.departmentImpact.map((row) => ({
        name: row.name,
        affected: row.affected,
      })),
    }
  }
}

export class SapAnalyticsCloudService extends MockAnalyticsCloudService {
  override readonly id = 'SapAnalyticsCloudService'
  override readonly connected = false
}

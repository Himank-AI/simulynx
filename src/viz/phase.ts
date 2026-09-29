export type VizPhaseId = 'idle' | 'analyzing' | 'identifying' | 'simulating' | 'mapping' | 'stress' | 'complete'

export interface VizReadout {
  id: VizPhaseId
  label: string
  energy: number
  progress: number
  wave: number
}

export function readViz(startedAt: number | null, now: number): VizReadout {
  if (startedAt == null) {
    return { id: 'idle', label: 'SIMULATION COMPLETE', energy: 0.34, progress: 1, wave: 0 }
  }
  const elapsed = now - startedAt
  const progress = Math.max(0, Math.min(1, elapsed / 4600))
  if (elapsed < 800) return { id: 'analyzing', label: 'ANALYZING DECISION', energy: 0.74, progress, wave: 0 }
  if (elapsed < 1700) return { id: 'identifying', label: 'IDENTIFYING AFFECTED WORKFORCE', energy: 0.88, progress, wave: 0 }
  if (elapsed < 2700) return { id: 'simulating', label: 'SIMULATING PERSONA TRANSITIONS', energy: 1, progress, wave: 0 }
  if (elapsed < 3700) return { id: 'mapping', label: 'MAPPING SKILL MOBILITY', energy: 1, progress, wave: 0 }
  if (elapsed < 4600) return { id: 'stress', label: 'STRESS-TESTING SCENARIO', energy: 0.95, progress, wave: 0 }
  if (elapsed < 6400) {
    return { id: 'complete', label: 'SIMULATION COMPLETE', energy: 0.48, progress: 1, wave: (elapsed - 4600) / 1400 }
  }
  return { id: 'idle', label: 'SIMULATION COMPLETE', energy: 0.34, progress: 1, wave: 0 }
}

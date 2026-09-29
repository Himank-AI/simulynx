import { useEffect } from 'react'
import { useStore } from '../state/store.tsx'

let committedAt = 0

export function VizDirector() {
  const { vizStartedAt, vizPending, commitRun, finishVisualization } = useStore()

  useEffect(() => {
    if (vizStartedAt == null || !vizPending) return
    const start = vizStartedAt
    const pending = vizPending
    const elapsed = Date.now() - start
    const commitTimer = window.setTimeout(() => {
      if (committedAt === start) return
      committedAt = start
      commitRun(pending.scenario, pending.result)
    }, Math.max(0, 4600 - elapsed))
    const finishTimer = window.setTimeout(() => {
      finishVisualization()
    }, Math.max(0, 6400 - elapsed))
    return () => {
      window.clearTimeout(commitTimer)
      window.clearTimeout(finishTimer)
    }
  }, [vizStartedAt, vizPending, commitRun, finishVisualization])

  return null
}

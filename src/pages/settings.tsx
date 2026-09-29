import { useState } from 'react'
import { PageHeader, Panel, Badge, Button } from '../components/ui.tsx'
import { PRODUCT_LOOP } from '../content.ts'
import { useStore } from '../state/store.tsx'
import { analyticsAdapter } from '../services/analytics/analyticsService.ts'
import { jouleAdapter } from '../services/joule/jouleService.ts'
import { buildAutomationAdapter } from '../services/sap/buildAutomationService.ts'
import { hanaAdapter } from '../services/sap/hanaService.ts'

const ADAPTERS = [
  { name: 'Joule', system: 'Joule', adapter: 'MockJouleAdapter', note: 'Interpretation and explanation stay inside the simulation context.' },
  { name: 'Scenario', system: 'Scenario service', adapter: 'Local scenario service', note: 'Parses a decision into a structured scenario before anything is run.' },
  { name: 'Workforce', system: 'Workforce service', adapter: 'Local workforce service', note: 'Reads the persistent synthetic persona graph.' },
  { name: 'Process staging', system: 'SAP Build Process Automation', adapter: 'MockBuildAutomationAdapter', note: 'Stages a local receipt. It does not submit a live process.' },
  { name: 'Workforce snapshot', system: 'SAP HANA Cloud', adapter: 'MockHanaAdapter', note: 'Serves the Demo Enterprise dataset from local modules.' },
  { name: 'Simulation', system: 'Simulation engine', adapter: 'Deterministic local engine', note: 'Same scenario, same result. No random draws.' },
  { name: 'Analytics', system: 'SAP Analytics Cloud', adapter: 'MockAnalyticsAdapter', note: 'Prepares chart series locally. Nothing is published.' },
]

export function Settings() {
  const { scenario, result } = useStore()
  const [lines, setLines] = useState<string[]>([])

  function selfCheck() {
    const snapshot = hanaAdapter.getSnapshot()
    const receipt = buildAutomationAdapter.stage(scenario, result.generatedAt)
    const story = analyticsAdapter.getStory(result)
    const reply = jouleAdapter.respond('What are the main risks?', { result })
    setLines([
      `${snapshot.system} via ${hanaAdapter.id}: ${snapshot.note}`,
      `${receipt.adapter} ${receipt.processId}: ${receipt.detail}`,
      `${story.adapter} ${story.storyId}: ${story.note}`,
      `${jouleAdapter.id}: ${reply.slice(0, 220)}…`,
    ])
  }

  return (
    <div>
      <PageHeader
        kicker="Architecture"
        title="Settings"
        subtitle="Adapter boundaries for a later SAP connection. Every adapter on this page is a mock."
      />
      <Panel title="Product loop" subtitle="The cockpit follows this sequence. Live systems are not attached.">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_LOOP.map((step, index) => (
            <li key={step} className="rounded-lg border border-line px-3 py-2 text-sm text-ink-800">
              <span className="mr-2 text-xs text-ink-400">{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
      </Panel>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {ADAPTERS.map((item) => (
          <Panel key={item.adapter + item.name} title={item.name} subtitle={item.system} action={<Badge tone="warn">Not connected</Badge>}>
            <p className="text-sm text-ink-800">{item.adapter}</p>
            <p className="mt-1 text-sm leading-6 text-ink-500">{item.note}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-4" title="Adapter self-check" subtitle="Runs the mock adapters against the committed scenario.">
        <Button variant="secondary" onClick={selfCheck}>Run adapter self-check</Button>
        {lines.length ? (
          <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-700">
            {lines.map((line) => (
              <li key={line} className="rounded-md bg-canvas px-3 py-2">{line}</li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  )
}

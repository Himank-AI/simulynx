import { useNavigate } from 'react-router-dom'
import { Button, Field, PageHeader, Panel, fieldClass } from '../components/ui.tsx'
import { useStore } from '../state/store.tsx'
import { EXAMPLE_PROMPTS } from '../services/scenario/scenarioService.ts'
import { runSimulation } from '../services/simulation/simulationEngine.ts'
import { listDepartments } from '../services/workforce/workforceService.ts'
import type { EvaluationMetrics, Interventions } from '../types.ts'

const INTERVENTIONS: [keyof Interventions, string][] = [
  ['reskilling', 'Reskilling'],
  ['redeployment', 'Redeployment'],
  ['roleRedesign', 'Role redesign'],
  ['hiring', 'Hiring'],
]

const METRICS: [keyof EvaluationMetrics, string][] = [
  ['workforceImpact', 'Workforce impact'],
  ['skills', 'Skills'],
  ['mobility', 'Mobility'],
  ['productivity', 'Productivity'],
  ['risk', 'Risk'],
]

export function ScenarioStudio() {
  const navigate = useNavigate()
  const store = useStore()
  const { studio } = store

  function run() {
    if (!studio.built || store.vizStartedAt) return
    const scenario = studio.built
    store.launchSimulation(scenario, runSimulation(scenario))
    navigate('/overview')
  }

  const draft = studio.draft
  const canBuild = Boolean(draft?.departmentId && draft.automationLevel !== null)

  return (
    <div>
      <PageHeader
        kicker="Decision lab"
        title="Scenario Studio"
        subtitle="Test a workforce decision before implementing it."
      />
      <Panel title="What workforce decision would you like to simulate?" subtitle="Joule interprets the sentence into a scenario. Nothing is simulated until you run it.">
        <textarea
          value={studio.prompt}
          onChange={(event) => store.setPrompt(event.target.value)}
          placeholder="Automate 20% of Customer Support over the next 12 months."
          rows={3}
          className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-6 text-ink-900 outline-none focus:border-brand-500"
          disabled={Boolean(store.vizStartedAt)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={Boolean(store.vizStartedAt)}
              className="rounded-full border border-line px-3 py-1 text-left text-xs text-ink-600 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
              onClick={() => store.interpretPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary" disabled={Boolean(store.vizStartedAt) || !studio.prompt.trim()} onClick={() => store.interpretPrompt(studio.prompt)}>
            Interpret with Joule
          </Button>
        </div>
        {studio.error ? <p className="mt-3 text-sm text-bad-700">{studio.error}</p> : null}
      </Panel>

      {draft ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <Panel title="Scenario interpretation" subtitle={studio.dirty ? 'Edited after interpretation.' : 'Confirm or edit before building.'}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Decision">
                <input className={fieldClass} value={draft.decision} readOnly />
              </Field>
              <Field label="Target department">
                <select
                  className={fieldClass}
                  value={draft.departmentId ?? ''}
                  onChange={(event) => store.updateDraft({ departmentId: event.target.value || null })}
                >
                  <option value="">Select</option>
                  {listDepartments().map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Automation level">
                <input
                  className={fieldClass}
                  type="number"
                  min={0}
                  max={100}
                  value={draft.automationLevel === null ? '' : Math.round(draft.automationLevel * 100)}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    store.updateDraft({ automationLevel: Number.isFinite(next) ? Math.min(100, Math.max(0, next)) / 100 : null, automationAssumed: false })
                  }}
                />
              </Field>
              <Field label="Time horizon (months)">
                <input
                  className={fieldClass}
                  type="number"
                  min={1}
                  max={36}
                  value={draft.timeHorizonMonths}
                  onChange={(event) => store.updateDraft({ timeHorizonMonths: Math.max(1, Number(event.target.value) || 1), horizonAssumed: false })}
                />
              </Field>
            </div>
            <fieldset className="mt-4">
              <legend className="text-xs font-medium text-ink-500">Potential interventions</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {INTERVENTIONS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-ink-800">
                    <input type="checkbox" checked={draft.interventions[key]} onChange={() => store.toggleIntervention(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className="text-xs font-medium text-ink-500">Evaluation metrics</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {METRICS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-ink-800">
                    <input type="checkbox" checked={draft.metrics[key]} onChange={() => store.toggleMetric(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!canBuild}
                onClick={() => {
                  store.buildScenario()
                  navigate('/overview')
                }}
              >
                Build Scenario
              </Button>
              <Button disabled={!studio.built} onClick={run}>
                Run Simulation
              </Button>
            </div>
            {studio.receipt ? (
              <div className="mt-4 rounded-lg border border-line bg-canvas px-3 py-3 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Process receipt</div>
                <p className="mt-1 font-medium text-ink-950">{studio.receipt.processId}</p>
                <p className="text-ink-600">{studio.receipt.status}</p>
                <p className="mt-1 text-xs leading-5 text-ink-500">{studio.receipt.detail}</p>
                <p className="mt-1 text-xs text-ink-400">Adapter: {studio.receipt.adapter}</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-400">Build stages the scenario with the mock process-automation adapter. Run executes the local engine.</p>
            )}
          </Panel>
          <Panel title="Joule reading" subtitle="MockJouleAdapter · not a live Joule connection">
            <ul className="space-y-2 text-sm leading-6 text-ink-700">
              {draft.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 text-xs text-ink-500">
              <div>Reskilling investment used by the engine: {Math.round(draft.reskillInvestment * 100)}%</div>
              <div>Training completion assumption: {Math.round(draft.trainingCompletion * 100)}%</div>
              <div>Redeployment capacity: {Math.round(draft.redeployCapacity * 100)}%</div>
            </dl>
          </Panel>
        </div>
      ) : null}
    </div>
  )
}

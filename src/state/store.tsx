import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { EvaluationMetrics, HistoryEntry, Interventions, ProcessReceipt, Scenario, ScenarioDraft, SimulationResult } from '../types.ts'
import { jouleAdapter, jouleIntro } from '../services/joule/jouleService.ts'
import { canonicalScenarios, draftToScenario, extraScenarios, investmentsFor, parseDecision } from '../services/scenario/scenarioService.ts'
import { buildAutomationAdapter } from '../services/sap/buildAutomationService.ts'
import { runSimulation, withParams } from '../services/simulation/simulationEngine.ts'

export interface WhatIfState {
  automationLevel: number
  reskillInvestment: number
  trainingCompletion: number
  redeployCapacity: number
}

interface StudioState {
  prompt: string
  draft: ScenarioDraft | null
  built: Scenario | null
  receipt: ProcessReceipt | null
  dirty: boolean
  error: string | null
}

export interface JouleMessage {
  id: string
  role: 'user' | 'joule'
  text: string
}

interface StoreValue {
  scenario: Scenario
  result: SimulationResult
  history: HistoryEntry[]
  studio: StudioState
  jouleOpen: boolean
  messages: JouleMessage[]
  personaId: string | null
  whatIf: WhatIfState
  notificationsRead: boolean
  vizStartedAt: number | null
  vizPending: { scenario: Scenario; result: SimulationResult } | null
  launchSimulation: (scenario: Scenario, result: SimulationResult) => void
  finishVisualization: () => void
  setPrompt: (prompt: string) => void
  interpretPrompt: (prompt: string) => void
  updateDraft: (patch: Partial<ScenarioDraft>) => void
  toggleIntervention: (key: keyof Interventions) => void
  toggleMetric: (key: keyof EvaluationMetrics) => void
  buildScenario: () => void
  commitRun: (scenario: Scenario, result: SimulationResult) => void
  restore: (id: string) => void
  openJoule: (question?: string) => void
  closeJoule: () => void
  askJoule: (question: string) => void
  openPersona: (id: string) => void
  closePersona: () => void
  setWhatIf: (patch: Partial<WhatIfState>) => void
  resetWhatIf: () => void
  stageWhatIf: () => void
  loadStudioFromActive: () => void
  resetStudio: () => void
  markNotificationsRead: () => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function whatIfFrom(scenario: Scenario): WhatIfState {
  return {
    automationLevel: scenario.automationLevel,
    reskillInvestment: scenario.reskillInvestment,
    trainingCompletion: scenario.trainingCompletion,
    redeployCapacity: scenario.redeployCapacity,
  }
}

function emptyStudio(): StudioState {
  return { prompt: '', draft: null, built: null, receipt: null, dirty: false, error: null }
}

function createSeed() {
  const history = [...canonicalScenarios(), ...extraScenarios()]
    .map((scenario) => {
      const result = runSimulation(scenario, {}, { id: `sim-${scenario.id}`, generatedAt: scenario.createdAt })
      const entry: HistoryEntry = { id: result.id, completedAt: scenario.createdAt, scenario, result }
      return entry
    })
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const active = history.find((entry) => entry.scenario.id === 'auto-20') ?? history[0]
  if (!active) throw new Error('Demo seed is empty')
  return { history, active }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [pack] = useState(createSeed)
  const [scenario, setScenario] = useState(pack.active.scenario)
  const [result, setResult] = useState(pack.active.result)
  const [history, setHistory] = useState(pack.history)
  const [studio, setStudio] = useState<StudioState>(emptyStudio)
  const [jouleOpen, setJouleOpen] = useState(false)
  const [messages, setMessages] = useState<JouleMessage[]>([
    { id: 'intro', role: 'joule', text: jouleIntro(pack.active.scenario) },
  ])
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [whatIf, setWhatIfState] = useState<WhatIfState>(whatIfFrom(pack.active.scenario))
  const [notificationsRead, setNotificationsRead] = useState(false)
  const [vizStartedAt, setVizStartedAt] = useState<number | null>(null)
  const [vizPending, setVizPending] = useState<{ scenario: Scenario; result: SimulationResult } | null>(null)

  const setPrompt = useCallback((prompt: string) => {
    setStudio((current) => ({ ...current, prompt }))
  }, [])

  const interpretPrompt = useCallback((prompt: string) => {
    const draft = parseDecision(prompt)
    setStudio({
      prompt,
      draft,
      built: null,
      receipt: null,
      dirty: false,
      error: prompt.trim() ? null : 'Enter a workforce decision to interpret.',
    })
  }, [])

  const updateDraft = useCallback((patch: Partial<ScenarioDraft>) => {
    setStudio((current) => {
      if (!current.draft) return current
      return {
        ...current,
        dirty: true,
        built: null,
        receipt: null,
        draft: { ...current.draft, ...patch },
      }
    })
  }, [])

  const toggleIntervention = useCallback((key: keyof Interventions) => {
    setStudio((current) => {
      if (!current.draft) return current
      const interventions = { ...current.draft.interventions, [key]: !current.draft.interventions[key] }
      return {
        ...current,
        dirty: true,
        built: null,
        receipt: null,
        draft: { ...current.draft, interventions, ...investmentsFor(interventions) },
      }
    })
  }, [])

  const toggleMetric = useCallback((key: keyof EvaluationMetrics) => {
    setStudio((current) => {
      if (!current.draft) return current
      return {
        ...current,
        dirty: true,
        built: null,
        receipt: null,
        draft: {
          ...current.draft,
          metrics: { ...current.draft.metrics, [key]: !current.draft.metrics[key] },
        },
      }
    })
  }, [])

  const buildScenario = useCallback(() => {
    setStudio((current) => {
      if (!current.draft?.departmentId || current.draft.automationLevel === null) {
        return { ...current, error: 'Choose a department and an automation level before building.' }
      }
      const built = draftToScenario(current.draft, `scn-${crypto.randomUUID().slice(0, 8)}`, new Date().toISOString())
      const receipt = buildAutomationAdapter.stage(built)
      return { ...current, built, receipt, error: null }
    })
  }, [])

  const commitRun = useCallback((nextScenario: Scenario, engineResult: SimulationResult) => {
    const completedAt = new Date().toISOString()
    const id = `run-${crypto.randomUUID().slice(0, 8)}`
    const committed = { ...nextScenario, status: 'complete' as const }
    const nextResult: SimulationResult = { ...engineResult, id, generatedAt: completedAt, scenario: committed }
    const entry: HistoryEntry = { id, completedAt, scenario: committed, result: nextResult }
    setHistory((current) => [entry, ...current])
    setScenario(committed)
    setResult(nextResult)
    setWhatIfState(whatIfFrom(committed))
    setNotificationsRead(false)
  }, [])

  const restore = useCallback(
    (id: string) => {
      const entry = history.find((item) => item.id === id)
      if (!entry) return
      setScenario(entry.scenario)
      setResult(entry.result)
      setWhatIfState(whatIfFrom(entry.scenario))
    },
    [history],
  )

  const askJoule = useCallback(
    (question: string) => {
      const text = question.trim()
      if (!text) return
      const reply = jouleAdapter.respond(text, { result })
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'user', text },
        { id: crypto.randomUUID(), role: 'joule', text: reply },
      ])
      setJouleOpen(true)
    },
    [result],
  )

  const openJoule = useCallback(
    (question?: string) => {
      setJouleOpen(true)
      if (question?.trim()) askJoule(question)
    },
    [askJoule],
  )

  const closeJoule = useCallback(() => setJouleOpen(false), [])
  const openPersona = useCallback((id: string) => setPersonaId(id), [])
  const closePersona = useCallback(() => setPersonaId(null), [])

  const setWhatIf = useCallback((patch: Partial<WhatIfState>) => {
    setWhatIfState((current) => ({ ...current, ...patch }))
  }, [])

  const resetWhatIf = useCallback(() => {
    setWhatIfState(whatIfFrom(scenario))
  }, [scenario])

  const stageWhatIf = useCallback(() => {
    const next = withParams(scenario, whatIf)
    next.id = `scn-${crypto.randomUUID().slice(0, 8)}`
    next.status = 'ready'
    next.createdAt = new Date().toISOString()
    const draft = parseDecision(next.rawPrompt)
    draft.departmentId = next.departmentId
    draft.automationLevel = next.automationLevel
    draft.timeHorizonMonths = next.timeHorizonMonths
    draft.decision = next.automationLevel > 0 ? 'Automation' : next.decision
    draft.interventions = { ...next.interventions }
    draft.reskillInvestment = next.reskillInvestment
    draft.trainingCompletion = next.trainingCompletion
    draft.redeployCapacity = next.redeployCapacity
    draft.notes = [...draft.notes, 'Staged from the counterfactual controls. Build and run it to commit a new simulation.']
    setStudio({ prompt: next.rawPrompt, draft, built: null, receipt: null, dirty: true, error: null })
  }, [scenario, whatIf])

  const loadStudioFromActive = useCallback(() => {
    const draft = parseDecision(scenario.rawPrompt)
    draft.departmentId = scenario.departmentId
    draft.automationLevel = scenario.automationLevel
    draft.timeHorizonMonths = scenario.timeHorizonMonths
    draft.decision = scenario.decision
    draft.interventions = { ...scenario.interventions }
    draft.metrics = { ...scenario.metrics }
    draft.reskillInvestment = scenario.reskillInvestment
    draft.trainingCompletion = scenario.trainingCompletion
    draft.redeployCapacity = scenario.redeployCapacity
    setStudio({ prompt: scenario.rawPrompt, draft, built: null, receipt: null, dirty: false, error: null })
  }, [scenario])

  const resetStudio = useCallback(() => setStudio(emptyStudio()), [])
  const markNotificationsRead = useCallback(() => setNotificationsRead(true), [])

  const launchSimulation = useCallback((next: Scenario, engineResult: SimulationResult) => {
    setVizStartedAt(Date.now())
    setVizPending({ scenario: next, result: engineResult })
  }, [])

  const finishVisualization = useCallback(() => {
    setVizStartedAt(null)
    setVizPending(null)
  }, [])

  const resetDemo = useCallback(() => {
    const next = createSeed()
    setHistory(next.history)
    setScenario(next.active.scenario)
    setResult(next.active.result)
    setWhatIfState(whatIfFrom(next.active.scenario))
    setStudio(emptyStudio())
    setMessages([{ id: 'intro', role: 'joule', text: jouleIntro(next.active.scenario) }])
    setPersonaId(null)
    setJouleOpen(false)
    setNotificationsRead(false)
    setVizStartedAt(null)
    setVizPending(null)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      scenario,
      result,
      history,
      studio,
      jouleOpen,
      messages,
      personaId,
      whatIf,
      notificationsRead,
      setPrompt,
      interpretPrompt,
      updateDraft,
      toggleIntervention,
      toggleMetric,
      buildScenario,
      commitRun,
      restore,
      openJoule,
      closeJoule,
      askJoule,
      openPersona,
      closePersona,
      setWhatIf,
      resetWhatIf,
      stageWhatIf,
      loadStudioFromActive,
      resetStudio,
      markNotificationsRead,
      resetDemo,
      vizStartedAt,
      vizPending,
      launchSimulation,
      finishVisualization,
    }),
    [
      scenario,
      result,
      history,
      studio,
      jouleOpen,
      messages,
      personaId,
      whatIf,
      notificationsRead,
      setPrompt,
      interpretPrompt,
      updateDraft,
      toggleIntervention,
      toggleMetric,
      buildScenario,
      commitRun,
      restore,
      openJoule,
      closeJoule,
      askJoule,
      openPersona,
      closePersona,
      setWhatIf,
      resetWhatIf,
      stageWhatIf,
      loadStudioFromActive,
      resetStudio,
      markNotificationsRead,
      resetDemo,
      vizStartedAt,
      vizPending,
      launchSimulation,
      finishVisualization,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}

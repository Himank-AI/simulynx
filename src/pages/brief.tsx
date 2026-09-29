import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader } from '../components/ui.tsx'
import { downloadText } from '../lib/download.ts'
import { useStore } from '../state/store.tsx'
import { briefToMarkdown, buildDecisionBrief } from '../services/analytics/analyticsService.ts'
import { canonicalScenarios } from '../services/scenario/scenarioService.ts'

export function DecisionBrief() {
  const navigate = useNavigate()
  const { result, loadStudioFromActive, resetStudio } = useStore()
  const brief = useMemo(() => {
    const alternatives = canonicalScenarios()
      .filter((scenario) => scenario.id !== result.scenario.id)
      .map((scenario) => `${scenario.name} — ${scenario.rawPrompt}`)
    return buildDecisionBrief(result, alternatives)
  }, [result])

  return (
    <div>
      <PageHeader
        kicker="For the decision maker"
        title="Decision Brief"
        subtitle="Evidence, simulated outcomes, assumptions, and trade-offs. Not a recommendation."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                loadStudioFromActive()
                navigate('/studio')
              }}
            >
              Modify Scenario
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                resetStudio()
                navigate('/studio')
              }}
            >
              Run Another Simulation
            </Button>
            <Button onClick={() => downloadText('simulynx-decision-brief.md', briefToMarkdown(brief))}>Export Decision Brief</Button>
          </>
        }
      />
      <article className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <header className="border-b border-line px-6 py-6 sm:px-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">SIMULYNX · Decision brief</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">{brief.scenarioName}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">{brief.prompt}</p>
        </header>
        <div className="space-y-6 px-6 py-6 sm:px-8">
          <Section index="01" title="Decision tested">
            <p>{brief.prompt}</p>
          </Section>
          <Section index="02" title="Scenario">
            <dl className="grid gap-2 sm:grid-cols-2">
              <Item label="Decision" value={brief.decision} />
              <Item label="Department" value={brief.department} />
              <Item label="Automation" value={brief.automation} />
              <Item label="Horizon" value={brief.horizon} />
            </dl>
          </Section>
          <Section index="03" title="Workforce impact">
            <p>{brief.affected} synthetic workforce personas are potentially affected under this scenario.</p>
            <ul className="mt-2 space-y-1">
              {brief.pathways.map((item) => (
                <li key={item.label} className="flex justify-between gap-3">
                  <span>{item.label}</span>
                  <span className="tabular-nums">{item.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-400">Simulation result — not a prediction.</p>
          </Section>
          <Section index="04" title="Skill impact">
            <p>Current skills: {brief.skills.current.join(', ')}</p>
            <p className="mt-1">Future skills: {brief.skills.future.join(', ')}</p>
          </Section>
          <Section index="05" title="Mobility opportunities">
            <p>{brief.mobility}</p>
          </Section>
          <Section index="06" title="Risks">
            <p>{brief.risk}</p>
            <ul className="mt-2 list-disc space-y-2 pl-4">
              {brief.stress.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section index="07" title="Key assumptions">
            <ul className="list-disc space-y-2 pl-4">
              {brief.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section index="08" title="Alternative scenarios">
            <ul className="list-disc space-y-2 pl-4">
              {brief.alternatives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section index="09" title="Questions for decision makers">
            <ul className="list-disc space-y-2 pl-4">
              {brief.questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section index="10" title="What the simulation does not know">
            <ul className="list-disc space-y-2 pl-4">
              {brief.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
        </div>
        <footer className="bg-black px-6 py-6 text-ink-950 sm:px-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-500">Human decision required</div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">
            Simulynx assembled simulated outcomes, assumptions, and trade-offs for this scenario. It does not recommend an action. The decision stays with the people accountable for it.
          </p>
          <p className="mt-5 text-lg font-medium">Don&apos;t ask what will happen after you commit.</p>
          <p className="text-lg">Simulate it before you commit.</p>
        </footer>
      </article>
    </div>
  )
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
        {index} · {title}
      </h3>
      <div className="mt-2 text-sm leading-6 text-ink-800">{children}</div>
    </section>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

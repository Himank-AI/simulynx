import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { PATHWAY_META } from '../content.ts'
import { yearsLabel } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'
import { getDepartment, getPersona, getRole, skillName } from '../services/workforce/workforceService.ts'

const LEVELS = ['', 'Foundation', 'Working', 'Proficient', 'Advanced', 'Expert']

export function PersonaDrawer() {
  const { personaId, closePersona, openPersona, result } = useStore()
  const persona = personaId ? getPersona(personaId) : undefined
  if (!persona) return null
  const role = getRole(persona.roleId)
  const department = getDepartment(persona.departmentId)
  const outcome = result.personaOutcomes.find((item) => item.personaId === persona.personaId)
  const manager = persona.managerPersonaId ? getPersona(persona.managerPersonaId) : undefined

  const skillMean = persona.currentSkills.reduce((sum, skill) => sum + skill.level, 0) / Math.max(1, persona.currentSkills.length)
  const learningBoost = persona.learningCapacity === 'High' ? 0.16 : persona.learningCapacity === 'Medium' ? 0.08 : 0
  const aiReadiness = Math.round(Math.min(0.96, Math.max(0.18, skillMean / 5 - persona.skillGapIds.length * 0.06 + learningBoost)) * 100)
  const exposure = outcome ? Math.min(96, Math.round(result.scenario.automationLevel * 100 + outcome.transitionScore * 0.45)) : null

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/40" aria-label="Close persona" onClick={closePersona} />
      <aside className="drawer-in glass fixed bottom-3 right-3 top-3 z-50 flex w-[min(440px,calc(100%-1.5rem))] flex-col rounded-2xl" aria-label={`Persona ${persona.personaId}`}>
        <header className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Synthetic persona</div>
              <h2 className="mt-1 font-mono text-lg font-medium text-ink-950">{persona.personaId}</h2>
              <p className="text-sm text-ink-700">{role?.name}</p>
              <p className="text-xs text-ink-500">{department.name} · {persona.location}</p>
            </div>
            <button type="button" className="rounded-md p-1 text-ink-500 hover:bg-canvas" aria-label="Close persona" onClick={closePersona}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="AI readiness" value={`${aiReadiness}%`} note="Model estimate" />
            <Metric label="Automation exposure" value={exposure === null ? 'Outside scope' : `${exposure}%`} note="Model estimate" />
            <Metric label="Learning velocity" value={persona.learningCapacity} note="Learning capacity" />
            <Metric label="Mobility" value={persona.mobilityPotential} note="Mobility potential" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="text-[10px] font-medium tracking-[0.16em] text-brand-500">SIMULATION OUTCOME</div>
            <div
              className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color: outcome ? PATHWAY_META[outcome.pathway].color : '#7F8B9A',
                boxShadow: outcome ? `0 0 18px ${PATHWAY_META[outcome.pathway].color}55` : undefined,
              }}
            >
              {outcome ? outcome.simulatedPathwayLabel : 'Not in scope'}
            </div>
          </div>
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-3">
            <div className="text-[10px] font-medium tracking-[0.16em] text-brand-700">✦ AI INSIGHT</div>
            <h3 className="mt-2 text-xs font-medium tracking-wide text-ink-400">WHY THIS OUTCOME?</h3>
            <p className="mt-1 text-sm leading-6 text-ink-800">
              {outcome ? outcome.rationale : `${persona.personaId} is outside the affected scope of ${result.scenario.name}. The committed run does not assign this persona a transition.`}
            </p>
          </div>
          <Section title="Identity">
            <Rows
              rows={[
                ['Department', department.name],
                ['Career stage', persona.careerStage],
                ['Location', persona.location],
                ['Work model', persona.workModel],
                ['Experience', yearsLabel(persona.experienceYears)],
                ['Organizational tenure', yearsLabel(persona.organizationalTenureYears)],
              ]}
            />
          </Section>
          <Section title="Skills">
            <ul className="space-y-2">
              {persona.currentSkills.map((skill) => (
                <li key={skill.skillId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-800">{skillName(skill.skillId)}</span>
                    <span className="text-xs text-ink-400">{LEVELS[skill.level]}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-canvas">
                    <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${skill.level * 20}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-700">
              <span className="text-ink-400">Skill gaps. </span>
              {persona.skillGapIds.length ? persona.skillGapIds.map((id) => skillName(id)).join(', ') : 'None modeled'}
            </p>
            {persona.emergingSkillIds.length ? (
              <p className="mt-1 text-sm text-ink-700">
                <span className="text-ink-400">Emerging skills. </span>
                {persona.emergingSkillIds.map((id) => skillName(id)).join(', ')}
              </p>
            ) : null}
          </Section>
          <Section title="Career">
            <Rows
              rows={[
                ['Trajectory', persona.careerTrajectory],
                ['Goals', persona.careerGoals.join(' ')],
                ['Mobility potential', persona.mobilityPotential],
                ['Learning capacity', persona.learningCapacity],
                ['Modeled transitions', persona.potentialTransitionRoleIds.map((id) => getRole(id)?.name ?? id).join(', ') || 'None in the graph'],
              ]}
            />
          </Section>
          <Section title="Work context">
            <Rows
              rows={[
                ['Workload', `${persona.workload}%`],
                ['Work pattern', persona.workPattern],
                ['Collaboration', persona.collaborationPreference],
              ]}
            />
            <div className="mt-2 h-1.5 rounded-full bg-canvas">
              <div className="h-1.5 rounded-full bg-ink-400" style={{ width: `${persona.workload}%` }} />
            </div>
            {persona.accessibilityContext ? (
              <p className="mt-3 rounded-md bg-canvas px-3 py-2 text-xs leading-5 text-ink-600">
                Work-design constraint: {persona.accessibilityContext} This is not used in the transition score.
              </p>
            ) : null}
          </Section>
          <Section title="Behavioral simulation parameters">
            <p className="mb-2 text-xs leading-5 text-ink-400">Model inputs for this synthetic persona. Not an assessment of a person.</p>
            <Rows
              rows={[
                ['Change tolerance', persona.changeTolerance],
                ['Learning adaptability', persona.learningAdaptability],
                ['Mobility readiness', persona.mobilityReadiness],
              ]}
            />
          </Section>
          <Section title="Relationships">
            <p className="text-sm text-ink-700">
              <span className="text-ink-400">Manager. </span>
              {manager ? (
                <button type="button" className="text-brand-700 hover:underline" onClick={() => openPersona(manager.personaId)}>
                  {manager.personaId}
                </button>
              ) : (
                'Not in the representative set'
              )}
            </p>
            <p className="mt-2 text-sm text-ink-700">
              <span className="text-ink-400">Collaborators. </span>
              {persona.collaborationPersonaIds.length
                ? persona.collaborationPersonaIds.map((id, index) => (
                    <span key={id}>
                      {index > 0 ? ', ' : ''}
                      <button type="button" className="text-brand-700 hover:underline" onClick={() => openPersona(id)}>
                        {id}
                      </button>
                    </span>
                  ))
                : 'None recorded'}
            </p>
            <p className="mt-2 text-sm text-ink-700">
              <span className="text-ink-400">Receiving departments. </span>
              {persona.receivingDepartmentIds.length ? persona.receivingDepartmentIds.map((id) => getDepartment(id).name).join(', ') : 'None recorded'}
            </p>
          </Section>
          <Section title="In the committed simulation">
            {outcome ? (
              <div className="text-sm leading-6 text-ink-700">
                <p>
                  Simulated pathway: <span className="font-medium text-ink-950">{outcome.simulatedPathwayLabel}</span>
                </p>
                <p className="text-xs text-ink-500">Transition score {outcome.transitionScore}. Model estimate, not a performance rating.</p>
                <p className="mt-2">{outcome.rationale}</p>
              </div>
            ) : (
              <p className="text-sm text-ink-500">Not in the affected scope of {result.scenario.name}.</p>
            )}
          </Section>
        </div>
      </aside>
    </>
  )
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] tracking-[0.14em] text-ink-400">{label.toUpperCase()}</div>
      <div className="mt-1 font-mono text-lg text-ink-950">{value}</div>
      <div className="text-[10px] text-ink-500">{note}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">{title}</h3>
      {children}
    </section>
  )
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="space-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[9.5rem_1fr] gap-2 text-sm">
          <dt className="text-ink-400">{label}</dt>
          <dd className="text-ink-800">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

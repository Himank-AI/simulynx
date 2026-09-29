import { useMemo, useState } from 'react'
import { SkillBars } from '../components/charts.tsx'
import { Badge, PageHeader, Panel, fieldClass } from '../components/ui.tsx'
import { useStore } from '../state/store.tsx'
import { listPathways, listPersonas, listSkills, skillName, getPersona, getRole, getDepartment, listDepartments } from '../services/workforce/workforceService.ts'

export function SkillsMobility() {
  const { result } = useStore()
  const pathways = listPathways()
  const [pathwayId, setPathwayId] = useState(pathways[0]?.id ?? '')
  const pathway = pathways.find((item) => item.id === pathwayId) ?? pathways[0]
  const candidates = useMemo(
    () => (pathway ? listPersonas().filter((persona) => persona.roleId === pathway.stepRoleIds[0]) : []),
    [pathway],
  )
  const [personaId, setPersonaId] = useState(pathway?.referencePersonaId ?? '')
  const persona = getPersona(candidates.some((item) => item.personaId === personaId) ? personaId : pathway?.referencePersonaId ?? '')
  const future = new Set(result.skillTransition.future)

  const distribution = useMemo(() => {
    return listSkills()
      .map((skill) => ({
        name: skill.name,
        personas: listPersonas().filter((persona) => persona.currentSkills.some((item) => item.skillId === skill.id && item.level >= 3)).length,
      }))
      .filter((row) => row.personas > 0)
      .sort((a, b) => b.personas - a.personas || a.name.localeCompare(b.name))
      .slice(0, 12)
  }, [])

  const gaps = useMemo(() => {
    const counts = new Map<string, { personas: number; departments: Set<string> }>()
    for (const persona of listPersonas()) {
      for (const gap of persona.skillGapIds) {
        const current = counts.get(gap) ?? { personas: 0, departments: new Set<string>() }
        current.personas += 1
        current.departments.add(getDepartment(persona.departmentId).name)
        counts.set(gap, current)
      }
    }
    return [...counts.entries()]
      .map(([id, value]) => ({ id, name: skillName(id), personas: value.personas, departments: [...value.departments].sort() }))
      .sort((a, b) => b.personas - a.personas || a.name.localeCompare(b.name))
  }, [])

  const held = new Set(persona?.currentSkills.filter((skill) => skill.level >= 3).map((skill) => skill.skillId) ?? [])
  const missing = pathway?.requiredSkillIds.filter((id) => !held.has(id)) ?? []

  return (
    <div>
      <PageHeader
        kicker="Skills intelligence"
        title="Skills & Mobility"
        subtitle="Current skills, modeled gaps, and internal paths. Figures are model estimates for the synthetic workforce."
      />
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Current skill distribution" subtitle="Representative personas at proficient or above">
          <SkillBars rows={distribution} />
        </Panel>
        <Panel className="xl:col-span-2" title="Emerging skill demand" subtitle="From department gaps and the committed scenario">
          <ul className="space-y-2">
            {listDepartments().flatMap((department) =>
              department.gapSkillIds.map((id) => {
                const name = skillName(id)
                const pressure = future.has(name) ? 'High' : department.riskExposure === 'Elevated' ? 'Medium' : 'Low'
                return (
                  <li key={`${department.id}-${id}`} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <span className="text-ink-900">{name}</span>
                      <span className="block text-xs text-ink-400">{department.name}</span>
                    </span>
                    <Badge tone={pressure === 'High' ? 'warn' : 'neutral'}>{pressure}</Badge>
                  </li>
                )
              }),
            )}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="Skill gaps" subtitle="Count of representative personas carrying each gap" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-ink-400">
              <tr className="border-b border-line">
                <th className="px-4 py-2 font-medium">Skill</th>
                <th className="px-4 py-2 font-medium">Personas</th>
                <th className="px-4 py-2 font-medium">Departments</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap) => (
                <tr key={gap.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink-950">{gap.name}</td>
                  <td className="px-4 py-2.5 tabular-nums">{gap.personas}</td>
                  <td className="px-4 py-2.5 text-ink-600">{gap.departments.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel title="Career pathways" subtitle="Click a path to inspect the skill gap">
          <div className="space-y-2">
            {pathways.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPathwayId(item.id)
                  setPersonaId(item.referencePersonaId)
                }}
                className={`block w-full rounded-lg border px-3 py-2 text-left ${item.id === pathway?.id ? 'border-brand-500 bg-brand-50' : 'border-line hover:bg-canvas'}`}
              >
                <div className="text-sm font-medium text-ink-950">{item.title}</div>
                <div className="mt-1 text-xs text-ink-500">{item.stepRoleIds.map((id) => getRole(id)?.name ?? id).join(' → ')}</div>
              </button>
            ))}
          </div>
        </Panel>
        {pathway && persona ? (
          <Panel title={pathway.title} subtitle={pathway.narrative}>
            <ol className="space-y-2">
              {pathway.stepRoleIds.map((id, index) => (
                <li key={id} className="flex items-center gap-2 text-sm text-ink-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-xs text-ink-500">{index + 1}</span>
                  {getRole(id)?.name}
                  {getRole(id)?.staffed === false ? <span className="text-xs text-ink-400">Modeled destination</span> : null}
                </li>
              ))}
            </ol>
            <label className="mt-4 block text-xs text-ink-500">
              Illustrate with representative persona
              <select className={`${fieldClass} mt-1`} value={persona.personaId} onChange={(event) => setPersonaId(event.target.value)}>
                {candidates.map((item) => (
                  <option key={item.personaId} value={item.personaId}>
                    {item.personaId}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <List title="Required skills" items={pathway.requiredSkillIds.map((id) => skillName(id))} />
              <List title="Existing skills" items={[...held].map((id) => skillName(id))} />
              <List title="Skill gap" items={missing.length ? missing.map((id) => skillName(id)) : ['No required skill is missing at proficient level']} />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Estimated learning requirement</div>
                <p className="mt-1 text-sm text-ink-800">{pathway.estimatedLearningMonths} months · model estimate</p>
                <p className="mt-2 text-sm text-ink-800">Mobility compatibility: {pathway.mobilityCompatibility}</p>
                <p className="text-sm text-ink-500">This persona’s mobility: {persona.mobilityPotential}</p>
              </div>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{title}</div>
      <ul className="mt-1 space-y-1 text-sm text-ink-800">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

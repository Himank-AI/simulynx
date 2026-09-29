import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Field, PageHeader, fieldClass } from '../components/ui.tsx'
import { useStore } from '../state/store.tsx'
import {
  coreSkillNames,
  filterPersonas,
  getDepartment,
  getRole,
  listDepartments,
  listPersonas,
  listRoles,
  listSkills,
  locations,
  skillName,
} from '../services/workforce/workforceService.ts'

const STAGES = ['Early', 'Developing', 'Established', 'Senior', 'Lead']
const BANDS = ['Low', 'Medium', 'High']
const MODELS = ['Office', 'Hybrid', 'Remote']

export function Personas() {
  const { openPersona } = useStore()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [careerStage, setCareerStage] = useState('')
  const [location, setLocation] = useState('')
  const [skillId, setSkillId] = useState('')
  const [gapId, setGapId] = useState('')
  const [mobility, setMobility] = useState('')
  const [learning, setLearning] = useState('')
  const [workModel, setWorkModel] = useState('')

  useEffect(() => {
    setQuery(params.get('q') ?? '')
  }, [params])

  const roles = listRoles().filter((role) => !departmentId || role.departmentId === departmentId)
  const results = useMemo(
    () =>
      filterPersonas({
        query,
        departmentId: departmentId || undefined,
        roleId: roleId || undefined,
        careerStage: careerStage || undefined,
        location: location || undefined,
        skillId: skillId || undefined,
        gapId: gapId || undefined,
        mobility: mobility || undefined,
        learning: learning || undefined,
        workModel: workModel || undefined,
      }),
    [query, departmentId, roleId, careerStage, location, skillId, gapId, mobility, learning, workModel],
  )

  function clearFilters() {
    setQuery('')
    setDepartmentId('')
    setRoleId('')
    setCareerStage('')
    setLocation('')
    setSkillId('')
    setGapId('')
    setMobility('')
    setLearning('')
    setWorkModel('')
  }

  return (
    <div>
      <PageHeader
        kicker="Representative set"
        title="Personas"
        subtitle="Persistent synthetic personas. Filters apply to the representative set, not to a live employee directory."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-xl border border-line bg-surface p-3 shadow-card">
          <Field label="Search">
            <input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, role, skill" />
          </Field>
          <Select label="Department" value={departmentId} onChange={(value) => { setDepartmentId(value); setRoleId('') }} options={listDepartments().map((item) => [item.id, item.name])} />
          <Select label="Role" value={roleId} onChange={setRoleId} options={roles.filter((role) => role.staffed).map((role) => [role.id, role.name])} />
          <Select label="Career stage" value={careerStage} onChange={setCareerStage} options={STAGES.map((item) => [item, item])} />
          <Select label="Location" value={location} onChange={setLocation} options={locations().map((item) => [item, item])} />
          <Select label="Skill" value={skillId} onChange={setSkillId} options={listSkills().map((skill) => [skill.id, skill.name])} />
          <Select label="Skill gap" value={gapId} onChange={setGapId} options={listSkills().map((skill) => [skill.id, skill.name])} />
          <Select label="Mobility" value={mobility} onChange={setMobility} options={BANDS.map((item) => [item, item])} />
          <Select label="Learning capacity" value={learning} onChange={setLearning} options={BANDS.map((item) => [item, item])} />
          <Select label="Work model" value={workModel} onChange={setWorkModel} options={MODELS.map((item) => [item, item])} />
          <button type="button" className="text-xs font-medium text-brand-700" onClick={clearFilters}>
            Clear filters
          </button>
        </aside>
        <div>
          <div className="mb-3 text-sm text-ink-500">
            {results.length} of {listPersonas().length} representative personas
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {results.map((persona) => {
              const gaps = persona.skillGapIds.map((id) => skillName(id))
              return (
                <button
                  key={persona.personaId}
                  type="button"
                  onClick={() => openPersona(persona.personaId)}
                  className="rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-brand-500/40"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink-950">{persona.personaId}</span>
                    <span className="text-xs text-ink-400">{persona.careerStage} · {persona.location} · {persona.workModel}</span>
                  </div>
                  <div className="mt-1 text-sm text-ink-800">{getRole(persona.roleId)?.name}</div>
                  <div className="text-xs text-ink-500">{getDepartment(persona.departmentId).name}</div>
                  <div className="mt-3 text-xs leading-5 text-ink-700">{coreSkillNames(persona).join(' · ')}</div>
                  <div className="mt-1 text-xs text-ink-500">Gap: {gaps.length ? gaps.join(', ') : 'None modeled'}</div>
                  <div className="mt-1 text-xs text-ink-600">{persona.careerTrajectory}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge>Mobility {persona.mobilityPotential}</Badge>
                    <Badge tone="brand">Learning {persona.learningCapacity}</Badge>
                  </div>
                </button>
              )
            })}
          </div>
          {results.length === 0 ? <p className="mt-6 text-sm text-ink-500">No representative persona matches these filters.</p> : null}
        </div>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <Field label={label}>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </Field>
  )
}

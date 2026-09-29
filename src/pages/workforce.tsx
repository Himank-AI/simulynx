import { useMemo, useState } from 'react'
import { PageHeader, Panel, RiskBadge, Badge } from '../components/ui.tsx'
import { cn } from '../lib/cn.ts'
import { formatNumber } from '../lib/format.ts'
import { useStore } from '../state/store.tsx'
import {
  getOrganization,
  listDepartments,
  personasInRole,
  rolesInDepartment,
  skillName,
} from '../services/workforce/workforceService.ts'
import { getRole } from '../services/workforce/workforceService.ts'

export function DigitalWorkforce() {
  const { scenario, openPersona } = useStore()
  const org = getOrganization()
  const departments = listDepartments()
  const [departmentId, setDepartmentId] = useState(scenario.departmentId)
  const roles = rolesInDepartment(departmentId)
  const [roleId, setRoleId] = useState<string | null>(roles.find((role) => role.staffed)?.id ?? roles[0]?.id ?? null)
  const activeRoles = useMemo(() => rolesInDepartment(departmentId), [departmentId])
  const selectedRole = activeRoles.find((role) => role.id === roleId) ?? null
  const people = selectedRole ? personasInRole(selectedRole.id) : []
  const department = departments.find((item) => item.id === departmentId) ?? departments[0]

  function chooseDepartment(id: string) {
    setDepartmentId(id)
    const nextRoles = rolesInDepartment(id)
    setRoleId(nextRoles.find((role) => role.staffed)?.id ?? nextRoles[0]?.id ?? null)
  }

  if (!department) return null

  return (
    <div>
      <PageHeader
        kicker="Persistent model"
        title="Digital Workforce"
        subtitle="A persistent synthetic representation of the organization's workforce."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {departments.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => chooseDepartment(item.id)}
            className={cn(
              'rounded-xl border bg-surface p-3 text-left shadow-card transition-colors hover:border-brand-500/40',
              item.id === departmentId ? 'border-brand-500' : 'border-line',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-ink-950">{item.name}</div>
              <RiskBadge level={item.riskExposure} />
            </div>
            <div className="mt-1 text-xs text-ink-500">{formatNumber(item.personaModelCount)} synthetic personas · {formatNumber(item.headcount)} modeled positions</div>
            <div className="mt-2 text-xs leading-5 text-ink-600">
              Skills: {item.majorSkillIds.slice(0, 3).map((id) => skillName(id)).join(', ')}
            </div>
            <div className="mt-1 text-xs leading-5 text-ink-600">Gaps: {item.gapSkillIds.map((id) => skillName(id)).join(', ')}</div>
            <div className="mt-2">
              <Badge>Mobility {item.mobilityPotential}</Badge>
            </div>
          </button>
        ))}
      </div>

      <Panel className="mt-4" title="Organization graph" subtitle="Enterprise, then department, role, and representative persona." bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 text-sm">
          <span className="font-medium text-ink-950">{org.name}</span>
          <span className="text-ink-300">/</span>
          <span className="text-ink-700">{department.name}</span>
          {selectedRole ? (
            <>
              <span className="text-ink-300">/</span>
              <span className="text-ink-700">{selectedRole.name}</span>
            </>
          ) : null}
          <span className="ml-auto text-xs text-ink-400">{formatNumber(org.workforce)} modeled positions · {formatNumber(org.digitalPersonas)} synthetic personas</span>
        </div>
        <div className="grid lg:grid-cols-[220px_240px_minmax(0,1fr)]">
          <div className="border-b border-line p-3 lg:border-b-0 lg:border-r">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Departments</div>
            <div className="space-y-1">
              {departments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseDepartment(item.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-canvas',
                    item.id === departmentId && 'bg-brand-50 text-brand-700',
                  )}
                >
                  <span>{item.name}</span>
                  <span className="text-xs tabular-nums text-ink-400">{item.personaModelCount}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="border-b border-line p-3 lg:border-b-0 lg:border-r">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Roles</div>
            <div className="space-y-1">
              {activeRoles.map((role) => {
                const count = personasInRole(role.id).length
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setRoleId(role.id)}
                    className={cn(
                      'block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-canvas',
                      role.id === selectedRole?.id && 'bg-brand-50 text-brand-700',
                    )}
                  >
                    <div>{role.name}</div>
                    <div className="text-[11px] text-ink-400">{role.staffed ? `${count} representative` : 'Modeled destination'}</div>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Representative personas</div>
            {selectedRole && !people.length ? (
              <p className="text-sm leading-6 text-ink-500">
                {selectedRole.name} is a modeled destination. {selectedRole.summary} No representative persona is assigned yet.
              </p>
            ) : null}
            <div className="space-y-2">
              {people.map((persona) => (
                <button
                  key={persona.personaId}
                  type="button"
                  onClick={() => openPersona(persona.personaId)}
                  className="block w-full rounded-lg border border-line px-3 py-2 text-left hover:border-brand-500/40"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink-950">{persona.personaId}</span>
                    <span className="text-xs text-ink-400">{persona.careerStage} · {persona.location}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-600">{persona.careerTrajectory}</p>
                  <p className="text-xs text-ink-400">
                    Transitions: {persona.potentialTransitionRoleIds.map((id) => getRole(id)?.name ?? id).join(', ') || 'None recorded'}
                  </p>
                </button>
              ))}
            </div>
            {selectedRole ? <p className="mt-3 text-xs leading-5 text-ink-400">{selectedRole.summary}</p> : null}
          </div>
        </div>
      </Panel>
      <p className="mt-3 text-xs leading-5 text-ink-400">
        Department counts are the synthetic model size. The cards below the counts are representative personas, not a full roster. {department.name} is open{department.id === scenario.departmentId ? ' because it is the committed scenario’s target department' : ' because you selected it'}.
      </p>
    </div>
  )
}

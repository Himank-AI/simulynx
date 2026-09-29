import type { Pathway, Persona, PersonaOutcome, Scenario } from '../types.ts'
import { getDepartment, getRole, listDepartments, listPersonas, skillName } from '../services/workforce/workforceService.ts'

export const COHORT_COLOR: Record<string, string> = {
  'dep-cs': '#35D6FF',
  'dep-tech': '#4F7CFF',
  'dep-fin': '#9AA8B8',
  'dep-hr': '#36E0A0',
  'dep-ops': '#7EB6FF',
  'dep-product': '#8BE7FF',
  'dep-sales': '#FFB84D',
  'dep-mkt': '#8AA4C8',
}

export const COHORT_ORDER = ['dep-cs', 'dep-tech', 'dep-fin', 'dep-hr', 'dep-ops', 'dep-product', 'dep-sales', 'dep-mkt']

export interface FieldNode {
  key: string
  kind: 'persona' | 'density'
  personaId?: string
  departmentId: string
  roleId: string
  label: string
  detail: string
  x: number
  y: number
  phase: number
  impact: number
  risk: 'low' | 'medium' | 'high'
  order: number
  location: string
  skillIds: string[]
  pathway?: Pathway
  active: boolean
}

export interface FieldLink {
  from: string
  to: string
}

function unitHash(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function orbitOf(persona: Persona): number {
  const role = getRole(persona.roleId)?.name ?? ''
  if (persona.careerStage === 'Lead' || persona.careerStage === 'Senior' || /manager/i.test(role)) return 150
  if (persona.careerStage === 'Established') return 248
  return 352
}

function impactOf(pathway?: Pathway): number {
  if (pathway === 'HIGH_TRANSITION_RISK' || pathway === 'ADDITIONAL_INTERVENTION') return 0.92
  if (pathway === 'RESKILL' || pathway === 'REDEPLOY') return 0.7
  if (pathway === 'ROLE_REDESIGN') return 0.55
  if (pathway === 'UNCHANGED') return 0.32
  return 0.36
}

function riskOf(pathway?: Pathway): FieldNode['risk'] {
  if (pathway === 'HIGH_TRANSITION_RISK') return 'high'
  if (pathway === 'ADDITIONAL_INTERVENTION') return 'medium'
  return 'low'
}

function place(departmentId: string, seed: string, radius: number): { x: number; y: number } {
  const index = Math.max(0, COHORT_ORDER.indexOf(departmentId))
  const sector = (Math.PI * 2) / COHORT_ORDER.length
  const center = -Math.PI / 2 + index * sector
  const angle = center + (unitHash(seed) - 0.5) * sector * 0.78
  const distance = radius + (unitHash(`${seed}:r`) - 0.5) * 42
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

export function buildField(scenario: Scenario, outcomes: PersonaOutcome[]): { nodes: FieldNode[]; links: FieldLink[] } {
  const outcomeById = new Map(outcomes.map((outcome) => [outcome.personaId, outcome]))
  const personas = listPersonas()
  const nodes: FieldNode[] = personas.map((persona, index) => {
    const outcome = outcomeById.get(persona.personaId)
    const role = getRole(persona.roleId)
    const point = place(persona.departmentId, persona.personaId, orbitOf(persona))
    const active = Boolean(outcome && (outcome.scope === 'origin' || outcome.pathway !== 'UNCHANGED'))
    return {
      key: persona.personaId,
      kind: 'persona',
      personaId: persona.personaId,
      departmentId: persona.departmentId,
      roleId: persona.roleId,
      label: persona.personaId,
      detail: `${role?.name ?? 'Role'} · ${getDepartment(persona.departmentId).name}`,
      x: point.x,
      y: point.y,
      phase: unitHash(`${persona.personaId}:p`) * Math.PI * 2,
      impact: impactOf(outcome?.pathway),
      risk: riskOf(outcome?.pathway),
      order: active ? index : 400 + index,
      location: persona.location,
      skillIds: [...persona.currentSkills.map((skill) => skill.skillId), ...persona.skillGapIds],
      pathway: outcome?.pathway,
      active,
    }
  })

  for (const department of listDepartments()) {
    const count = Math.min(70, Math.max(8, Math.round(department.personaModelCount / 8)))
    for (let index = 0; index < count; index += 1) {
      const seed = `${department.id}:d:${index}`
      const radius = unitHash(seed) > 0.72 ? 250 : 368
      const point = place(department.id, seed, radius)
      const inScope = department.id === scenario.departmentId
      nodes.push({
        key: seed,
        kind: 'density',
        departmentId: department.id,
        roleId: '',
        label: department.name,
        detail: 'Cohort density · synthetic model mass, not an individual persona',
        x: point.x,
        y: point.y,
        phase: unitHash(`${seed}:p`) * Math.PI * 2,
        impact: inScope ? 0.48 : 0.22,
        risk: inScope && department.riskExposure === 'Elevated' ? 'medium' : 'low',
        order: 800 + index,
        location: '',
        skillIds: [],
        active: inScope,
      })
    }
  }

  nodes.sort((a, b) => a.order - b.order)
  nodes.forEach((node, index) => {
    node.order = index
  })

  const present = new Set(personas.map((persona) => persona.personaId))
  const links: FieldLink[] = []
  const seen = new Set<string>()
  for (const persona of personas) {
    links.push({ from: persona.personaId, to: 'core' })
    if (persona.managerPersonaId && present.has(persona.managerPersonaId)) {
      const key = [persona.personaId, persona.managerPersonaId].sort().join(':')
      if (!seen.has(key)) {
        seen.add(key)
        links.push({ from: persona.personaId, to: persona.managerPersonaId })
      }
    }
    for (const collaborator of persona.collaborationPersonaIds) {
      if (!present.has(collaborator)) continue
      const key = [persona.personaId, collaborator].sort().join(':')
      if (seen.has(key)) continue
      seen.add(key)
      links.push({ from: persona.personaId, to: collaborator })
    }
  }

  return { nodes, links }
}

export function cohortName(departmentId: string): string {
  return getDepartment(departmentId).name
}

export function personaSkillLine(persona: Persona): string {
  return persona.currentSkills
    .slice(0, 3)
    .map((skill) => skillName(skill.skillId))
    .join(' · ')
}

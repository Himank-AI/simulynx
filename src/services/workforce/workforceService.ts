import type { Department, Persona, Role, Skill } from '../../types.ts'
import { workforceSnapshot } from '../sap/hanaService.ts'

const departments = workforceSnapshot.departments
const roles = workforceSnapshot.roles
const skills = workforceSnapshot.skills
const personas = workforceSnapshot.personas
const pathways = workforceSnapshot.pathways

const departmentById = new Map(departments.map((department) => [department.id, department]))
const roleById = new Map(roles.map((role) => [role.id, role]))
const skillById = new Map(skills.map((skill) => [skill.id, skill]))
const personaById = new Map(personas.map((persona) => [persona.personaId, persona]))

export function getOrganization() {
  return workforceSnapshot.organization
}

export function listDepartments(): Department[] {
  return departments
}

export function listRoles(): Role[] {
  return roles
}

export function listSkills(): Skill[] {
  return skills
}

export function listPersonas(): Persona[] {
  return personas
}

export function listPathways() {
  return pathways
}

export function getDepartment(id: string): Department {
  const department = departmentById.get(id)
  if (!department) throw new Error(`Unknown department ${id}`)
  return department
}

export function getRole(id: string): Role | undefined {
  return roleById.get(id)
}

export function getSkill(id: string): Skill | undefined {
  return skillById.get(id)
}

export function skillName(id: string): string {
  return skillById.get(id)?.name ?? id
}

export function getPersona(id: string): Persona | undefined {
  return personaById.get(id)
}

export function rolesInDepartment(departmentId: string): Role[] {
  return roles.filter((role) => role.departmentId === departmentId)
}

export function personasInRole(roleId: string): Persona[] {
  return personas.filter((persona) => persona.roleId === roleId)
}

export function personasInDepartment(departmentId: string): Persona[] {
  return personas.filter((persona) => persona.departmentId === departmentId)
}

export interface PersonaFilters {
  query?: string
  departmentId?: string
  roleId?: string
  careerStage?: string
  location?: string
  skillId?: string
  gapId?: string
  mobility?: string
  learning?: string
  workModel?: string
}

export function filterPersonas(filters: PersonaFilters): Persona[] {
  const query = filters.query?.trim().toLowerCase() ?? ''
  return personas.filter((persona) => {
    if (filters.departmentId && persona.departmentId !== filters.departmentId) return false
    if (filters.roleId && persona.roleId !== filters.roleId) return false
    if (filters.careerStage && persona.careerStage !== filters.careerStage) return false
    if (filters.location && persona.location !== filters.location) return false
    if (filters.mobility && persona.mobilityPotential !== filters.mobility) return false
    if (filters.learning && persona.learningCapacity !== filters.learning) return false
    if (filters.workModel && persona.workModel !== filters.workModel) return false
    if (filters.skillId && !persona.currentSkills.some((skill) => skill.skillId === filters.skillId)) return false
    if (filters.gapId && !persona.skillGapIds.includes(filters.gapId)) return false
    if (!query) return true
    const role = roleById.get(persona.roleId)
    const department = departmentById.get(persona.departmentId)
    const haystack = [
      persona.personaId,
      role?.name ?? '',
      department?.name ?? '',
      persona.location,
      persona.careerTrajectory,
      ...persona.currentSkills.map((skill) => skillName(skill.skillId)),
      ...persona.skillGapIds.map((id) => skillName(id)),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
}

export function locations(): string[] {
  return [...new Set(personas.map((persona) => persona.location))].sort()
}

export function coreSkillNames(persona: Persona, limit = 3): string[] {
  return [...persona.currentSkills]
    .sort((a, b) => b.level - a.level || a.skillId.localeCompare(b.skillId))
    .slice(0, limit)
    .map((skill) => skillName(skill.skillId))
}

import type { CareerPathway, Department, Organization, Persona, Role, Skill } from './types.ts'

export interface Catalog {
  organization: Organization
  departments: Map<string, Department>
  roles: Map<string, Role>
  skills: Map<string, Skill>
  personas: Persona[]
  pathways: CareerPathway[]
}

let state: Catalog | null = null

export function bindCatalog(catalog: Catalog): void {
  state = catalog
}

function catalog(): Catalog {
  if (!state) throw new Error('Workforce catalog is not loaded.')
  return state
}

export function getOrganization(): Organization {
  return catalog().organization
}

export function listDepartments(): Department[] {
  return [...catalog().departments.values()]
}

export function getDepartment(id: string): Department {
  const found = catalog().departments.get(id)
  if (!found) throw new Error(`Unknown department ${id}.`)
  return found
}

export function listRoles(): Role[] {
  return [...catalog().roles.values()]
}

export function getRole(id: string): Role | undefined {
  return catalog().roles.get(id)
}

export function listSkills(): Skill[] {
  return [...catalog().skills.values()]
}

export function getSkill(id: string): Skill | undefined {
  return catalog().skills.get(id)
}

export function skillName(id: string): string {
  return getSkill(id)?.name ?? id
}

export function listPersonas(): Persona[] {
  return catalog().personas
}

export function getPersona(id: string): Persona | undefined {
  return catalog().personas.find((persona) => persona.personaId === id)
}

export function listPathways(): CareerPathway[] {
  return catalog().pathways
}

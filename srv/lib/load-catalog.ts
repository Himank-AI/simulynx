import cds from '@sap/cds'
import { bindCatalog } from '../engine/catalog.ts'
import type { CareerPathway, Department, Persona, Role, Skill } from '../engine/types.ts'

let ready = false

export async function ensureCatalog(force = false): Promise<void> {
  if (ready && !force) return
  const [organization] = await cds.run(SELECT.from('simulynx.Organizations'))
  if (!organization) throw new Error('Demo Enterprise is not seeded.')

  const departmentRows = await cds.run(SELECT.from('simulynx.Departments'))
  const departmentSkills = await cds.run(SELECT.from('simulynx.DepartmentSkills'))
  const roleRows = await cds.run(SELECT.from('simulynx.Roles'))
  const skillRows = await cds.run(SELECT.from('simulynx.Skills'))
  const personaRows = await cds.run(SELECT.from('simulynx.Personas'))
  const personaSkills = await cds.run(SELECT.from('simulynx.PersonaSkills'))
  const gaps = await cds.run(SELECT.from('simulynx.SkillGaps'))
  const transitions = await cds.run(SELECT.from('simulynx.PersonaTransitions'))
  const collaborators = await cds.run(SELECT.from('simulynx.PersonaCollaborators'))
  const receiving = await cds.run(SELECT.from('simulynx.PersonaReceiving'))
  const pathRows = await cds.run(SELECT.from('simulynx.CareerPaths'))
  const steps = await cds.run(SELECT.from('simulynx.CareerPathSteps'))
  const pathSkills = await cds.run(SELECT.from('simulynx.CareerPathSkills'))

  const departments = new Map<string, Department>()
  for (const row of departmentRows) {
    const skills = departmentSkills.filter((item: { department_ID: string }) => item.department_ID === row.ID)
    departments.set(row.ID, {
      id: row.ID,
      name: row.name,
      headcount: Number(row.headcount),
      personaModelCount: Number(row.personaModelCount),
      majorSkillIds: skills.filter((item: { relation: string }) => item.relation === 'major').map((item: { skill_ID: string }) => item.skill_ID),
      gapSkillIds: skills.filter((item: { relation: string }) => item.relation === 'gap').map((item: { skill_ID: string }) => item.skill_ID),
      mobilityPotential: row.mobilityPotential,
      riskExposure: row.riskExposure,
      readiness: Number(row.readiness),
      summary: row.summary,
    })
  }

  const roles = new Map<string, Role>()
  for (const row of roleRows) {
    roles.set(row.ID, {
      id: row.ID,
      name: row.name,
      departmentId: row.department_ID,
      family: row.family,
      summary: row.summary,
      staffed: row.staffed === true || row.staffed === 1,
    })
  }

  const skills = new Map<string, Skill>()
  for (const row of skillRows) {
    skills.set(row.ID, { id: row.ID, name: row.name, category: row.category })
  }

  const personas: Persona[] = personaRows
    .map((row: Record<string, unknown>) => {
      const id = String(row.ID)
      const current = personaSkills.filter(
        (item: { persona_ID: string; kind: string }) => item.persona_ID === id && item.kind === 'current',
      )
      return {
        personaId: id,
        roleId: String(row.role_ID),
        departmentId: String(row.department_ID),
        careerStage: row.careerStage_code,
        location: String(row.location_ID),
        workModel: row.workModel_code,
        currentSkills: current.map((item: { skill_ID: string; proficiency: number }) => ({
          skillId: item.skill_ID,
          level: Number(item.proficiency),
        })),
        emergingSkillIds: personaSkills
          .filter((item: { persona_ID: string; kind: string }) => item.persona_ID === id && item.kind === 'emerging')
          .map((item: { skill_ID: string }) => item.skill_ID),
        skillGapIds: gaps
          .filter((item: { persona_ID: string }) => item.persona_ID === id)
          .map((item: { skill_ID: string }) => item.skill_ID),
        careerGoals: row.careerGoal ? [String(row.careerGoal)] : [],
        careerTrajectory: String(row.careerTrajectory ?? ''),
        mobilityPotential: row.mobilityPotential,
        learningCapacity: row.learningCapacity,
        workload: Number(row.workload),
        experienceYears: Number(row.experienceYears),
        workPattern: String(row.workPattern ?? ''),
        accessibilityContext: row.accessibilityContext ? String(row.accessibilityContext) : undefined,
        organizationalTenureYears: Number(row.organizationalTenureYears),
        changeTolerance: row.changeTolerance,
        learningAdaptability: row.learningAdaptability,
        mobilityReadiness: row.mobilityReadiness,
        collaborationPreference: row.collaborationPreference,
        managerPersonaId: row.manager_ID ? String(row.manager_ID) : undefined,
        collaborationPersonaIds: collaborators
          .filter((item: { persona_ID: string }) => item.persona_ID === id)
          .map((item: { collaborator_ID: string }) => item.collaborator_ID),
        potentialTransitionRoleIds: transitions
          .filter((item: { persona_ID: string }) => item.persona_ID === id)
          .map((item: { role_ID: string }) => item.role_ID),
        receivingDepartmentIds: receiving
          .filter((item: { persona_ID: string }) => item.persona_ID === id)
          .map((item: { department_ID: string }) => item.department_ID),
      } as Persona
    })
    .sort((left: Persona, right: Persona) => left.personaId.localeCompare(right.personaId))

  const pathways: CareerPathway[] = pathRows.map((row: Record<string, unknown>) => ({
    id: String(row.ID),
    title: String(row.title),
    stepRoleIds: steps
      .filter((item: { path_ID: string }) => item.path_ID === row.ID)
      .sort((left: { step: number }, right: { step: number }) => Number(left.step) - Number(right.step))
      .map((item: { role_ID: string }) => item.role_ID),
    requiredSkillIds: pathSkills
      .filter((item: { path_ID: string }) => item.path_ID === row.ID)
      .map((item: { skill_ID: string }) => item.skill_ID),
    estimatedLearningMonths: Number(row.estimatedLearningMonths),
    mobilityCompatibility: row.mobilityCompatibility,
    referencePersonaId: String(row.referencePersona_ID),
    narrative: String(row.narrative),
  }))

  bindCatalog({
    organization: {
      id: organization.ID,
      name: organization.name,
      workforce: Number(organization.workforce),
      digitalPersonas: Number(organization.digitalPersonas),
      reskillingOpportunities: Number(organization.reskillingInventory),
      redeploymentOpportunities: Number(organization.redeploymentInventory),
      description: organization.description,
    },
    departments,
    roles,
    skills,
    personas,
    pathways,
  })
  ready = true
}

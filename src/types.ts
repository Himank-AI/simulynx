export type CareerStage = 'Early' | 'Developing' | 'Established' | 'Senior' | 'Lead'
export type WorkModel = 'Office' | 'Hybrid' | 'Remote'
export type Band = 'Low' | 'Medium' | 'High'
export type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
export type CollaborationStyle = 'Independent' | 'Paired' | 'Team'
export type SkillCategory = 'core' | 'emerging' | 'leadership' | 'domain'
export type Pathway =
  | 'UNCHANGED'
  | 'RESKILL'
  | 'REDEPLOY'
  | 'ROLE_REDESIGN'
  | 'HIGH_TRANSITION_RISK'
  | 'ADDITIONAL_INTERVENTION'

export type ScopeKind = 'origin' | 'enabling' | 'receiving'
export type ConnectionMode = 'mock' | 'live'

export interface Skill {
  id: string
  name: string
  category: SkillCategory
}

export interface SkillProficiency {
  skillId: string
  level: 1 | 2 | 3 | 4 | 5
}

export interface Department {
  id: string
  name: string
  headcount: number
  personaModelCount: number
  majorSkillIds: string[]
  gapSkillIds: string[]
  mobilityPotential: Band
  riskExposure: RiskLevel
  readiness: number
  summary: string
}

export interface Role {
  id: string
  name: string
  departmentId: string
  family: string
  summary: string
  staffed: boolean
}

export interface Organization {
  id: string
  name: string
  workforce: number
  digitalPersonas: number
  reskillingOpportunities: number
  redeploymentOpportunities: number
  description: string
}

export interface Persona {
  personaId: string
  roleId: string
  departmentId: string
  careerStage: CareerStage
  location: string
  workModel: WorkModel
  currentSkills: SkillProficiency[]
  emergingSkillIds: string[]
  skillGapIds: string[]
  careerGoals: string[]
  careerTrajectory: string
  mobilityPotential: Band
  learningCapacity: Band
  workload: number
  experienceYears: number
  workPattern: string
  accessibilityContext?: string
  organizationalTenureYears: number
  changeTolerance: Band
  learningAdaptability: Band
  mobilityReadiness: Band
  collaborationPreference: CollaborationStyle
  managerPersonaId?: string
  collaborationPersonaIds: string[]
  potentialTransitionRoleIds: string[]
  receivingDepartmentIds: string[]
}

export interface CareerPathway {
  id: string
  title: string
  stepRoleIds: string[]
  requiredSkillIds: string[]
  estimatedLearningMonths: number
  mobilityCompatibility: Band
  referencePersonaId: string
  narrative: string
}

export interface Interventions {
  reskilling: boolean
  redeployment: boolean
  roleRedesign: boolean
  hiring: boolean
}

export interface EvaluationMetrics {
  workforceImpact: boolean
  skills: boolean
  mobility: boolean
  productivity: boolean
  risk: boolean
}

export interface Scenario {
  id: string
  name: string
  rawPrompt: string
  decision: string
  departmentId: string
  automationLevel: number
  timeHorizonMonths: number
  interventions: Interventions
  metrics: EvaluationMetrics
  reskillInvestment: number
  trainingCompletion: number
  redeployCapacity: number
  status: 'draft' | 'ready' | 'complete'
  createdAt: string
}

export interface ScenarioDraft {
  rawPrompt: string
  decision: string
  departmentId: string | null
  automationLevel: number | null
  timeHorizonMonths: number
  horizonAssumed: boolean
  automationAssumed: boolean
  interventions: Interventions
  metrics: EvaluationMetrics
  notes: string[]
  reskillInvestment: number
  trainingCompletion: number
  redeployCapacity: number
}

export interface EngineModifiers {
  nearTermShock?: number
  transitionUptake?: number
  skillShiftPenalty?: number
}

export interface PersonaOutcome {
  personaId: string
  scope: ScopeKind
  pathway: Pathway
  simulatedPathwayLabel: string
  transitionScore: number
  skillGapLabel: string
  targetRoleId?: string
  rationale: string
}

export interface DepartmentImpact {
  key: string
  name: string
  kind: 'origin' | 'enabling' | 'receiving'
  affected: number
  narrative: string
  capacityStrain: Band
  netLoad: number
}

export interface Assumption {
  id: string
  statement: string
  sensitivity: Band
  source: string
}

export interface SimulationResult {
  id: string
  generatedAt: string
  scenario: Scenario
  affected: number
  directScope: number
  pathways: Record<Pathway, number>
  productivityNearTerm: number
  productivityHorizon: number
  skillReadiness: number
  transitionRisk: RiskLevel
  riskScore: number
  riskDriver: string
  skillTransition: { current: string[]; future: string[] }
  departmentImpact: DepartmentImpact[]
  personaOutcomes: PersonaOutcome[]
  assumptions: Assumption[]
  reskillDemand: number
  redeployDemand: number
  limitations: string[]
}

export interface HistoryEntry {
  id: string
  completedAt: string
  scenario: Scenario
  result: SimulationResult
}

export interface ProcessReceipt {
  adapter: 'MockBuildAutomationAdapter'
  connection: 'mock'
  processId: string
  status: string
  detail: string
  stagedAt: string
  scenarioId: string
}

export interface AnalyticsStory {
  adapter: 'MockAnalyticsAdapter'
  connection: 'mock'
  storyId: string
  published: false
  note: string
  pathwaySeries: { key: Pathway; name: string; value: number; fill: string }[]
  departmentSeries: { name: string; affected: number }[]
}

export interface WorkforceSnapshot {
  source: 'synthetic-local'
  system: 'SAP HANA Cloud'
  connected: false
  note: string
  organization: Organization
  departments: Department[]
  roles: Role[]
  personas: Persona[]
  skills: Skill[]
  pathways: CareerPathway[]
}

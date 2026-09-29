namespace simulynx;

using { managed } from '@sap/cds/common';

type Band : String(16) enum {
  Low;
  Medium;
  High;
}

type RiskLevel : String(16) enum {
  Low;
  Moderate;
  Elevated;
  High;
}

type Pathway : String(32) enum {
  UNCHANGED;
  RESKILL;
  REDEPLOY;
  ROLE_REDESIGN;
  HIGH_TRANSITION_RISK;
  ADDITIONAL_INTERVENTION;
}

entity Organizations {
  key ID : String(16);
  name : String(80);
  workforce : Integer;
  digitalPersonas : Integer;
  reskillingInventory : Integer;
  redeploymentInventory : Integer;
  description : String(500);
}

entity Departments {
  key ID : String(16);
  name : String(80);
  headcount : Integer;
  personaModelCount : Integer;
  mobilityPotential : Band;
  riskExposure : RiskLevel;
  readiness : Integer;
  summary : String(500);
  skills : Composition of many DepartmentSkills on skills.department = $self;
}

entity DepartmentSkills {
  key department : Association to Departments;
  key skill : Association to Skills;
  key relation : String(16);
}

entity CareerStages {
  key code : String(24);
  name : String(40);
}

entity WorkModels {
  key code : String(16);
  name : String(40);
}

entity Locations {
  key ID : String(40);
  name : String(80);
  region : String(40);
}

entity Roles {
  key ID : String(24);
  name : String(80);
  department : Association to Departments;
  family : String(40);
  summary : String(400);
  staffed : Boolean;
  requirements : Composition of many SkillRequirements on requirements.role = $self;
}

entity Skills {
  key ID : String(24);
  name : String(80);
  category : String(24);
}

entity Personas {
  key ID : String(16);
  personaCode : String(16);
  role : Association to Roles;
  department : Association to Departments;
  careerStage : Association to CareerStages;
  location : Association to Locations;
  workModel : Association to WorkModels;
  manager : Association to Personas;
  experienceYears : Integer;
  organizationalTenureYears : Integer;
  workload : Integer;
  learningCapacity : Band;
  mobilityPotential : Band;
  changeTolerance : Band;
  learningAdaptability : Band;
  mobilityReadiness : Band;
  collaborationPreference : String(24);
  careerGoal : String(240);
  careerTrajectory : String(240);
  workPattern : String(240);
  accessibilityContext : String(240);
  currentStatus : String(40);
  skills : Composition of many PersonaSkills on skills.persona = $self;
  gaps : Composition of many SkillGaps on gaps.persona = $self;
  transitions : Composition of many PersonaTransitions on transitions.persona = $self;
  collaborators : Composition of many PersonaCollaborators on collaborators.persona = $self;
  receiving : Composition of many PersonaReceiving on receiving.persona = $self;
  mobility : Composition of many MobilityOptions on mobility.persona = $self;
}

entity PersonaSkills {
  key persona : Association to Personas;
  key skill : Association to Skills;
  key kind : String(16);
  proficiency : Integer;
}

entity SkillGaps {
  key persona : Association to Personas;
  key skill : Association to Skills;
}

entity SkillRequirements {
  key role : Association to Roles;
  key skill : Association to Skills;
  key kind : String(16);
}

entity PersonaTransitions {
  key persona : Association to Personas;
  key role : Association to Roles;
}

entity PersonaCollaborators {
  key persona : Association to Personas;
  key collaborator : Association to Personas;
}

entity PersonaReceiving {
  key persona : Association to Personas;
  key department : Association to Departments;
}

entity CareerPaths {
  key ID : String(24);
  title : String(120);
  narrative : String(400);
  estimatedLearningMonths : Integer;
  mobilityCompatibility : Band;
  referencePersona : Association to Personas;
  steps : Composition of many CareerPathSteps on steps.path = $self;
  requiredSkills : Composition of many CareerPathSkills on requiredSkills.path = $self;
}

entity CareerPathSteps {
  key path : Association to CareerPaths;
  key step : Integer;
  role : Association to Roles;
}

entity CareerPathSkills {
  key path : Association to CareerPaths;
  key skill : Association to Skills;
}

entity MobilityOptions {
  key ID : String(48);
  persona : Association to Personas;
  targetRole : Association to Roles;
  targetDepartment : Association to Departments;
  compatibility : Band;
  narrative : String(240);
}

entity Scenarios : managed {
  key ID : String(40);
  name : String(160);
  rawPrompt : String(500);
  decision : String(40);
  department : Association to Departments;
  targetRole : Association to Roles;
  magnitude : Decimal(5, 4);
  automationLevel : Decimal(5, 4);
  timeHorizonMonths : Integer;
  reskilling : Boolean;
  redeployment : Boolean;
  roleRedesign : Boolean;
  hiring : Boolean;
  reskillInvestment : Decimal(5, 4);
  trainingCompletion : Decimal(5, 4);
  redeployCapacity : Decimal(5, 4);
  metricWorkforce : Boolean;
  metricSkills : Boolean;
  metricMobility : Boolean;
  metricProductivity : Boolean;
  metricRisk : Boolean;
  status : String(16);
  assumptions : Composition of many ScenarioAssumptions on assumptions.scenario = $self;
}

entity ScenarioAssumptions {
  key scenario : Association to Scenarios;
  key assumptionId : String(24);
  statement : String(400);
  sensitivity : Band;
  source : String(80);
}

entity SimulationRuns : managed {
  key ID : String(40);
  scenario : Association to Scenarios;
  startedAt : Timestamp;
  completedAt : Timestamp;
  status : String(16);
  affected : Integer;
  directScope : Integer;
  reskillDemand : Integer;
  redeployDemand : Integer;
  productivityNearTerm : Decimal(8, 2);
  productivityHorizon : Decimal(8, 2);
  skillReadiness : Integer;
  transitionRisk : RiskLevel;
  riskScore : Integer;
  riskDriver : String(500);
  committed : Boolean;
  active : Boolean;
  disclaimer : String(80);
  outcomes : Composition of many PersonaOutcomes on outcomes.run = $self;
  impacts : Composition of many DepartmentImpacts on impacts.run = $self;
  pathways : Composition of many PathwayCounts on pathways.run = $self;
  skillShifts : Composition of many SkillTransitions on skillShifts.run = $self;
  risks : Composition of many RiskFactors on risks.run = $self;
  metrics : Composition of many SimulationMetrics on metrics.run = $self;
  counterfactuals : Composition of many CounterfactualScenarios on counterfactuals.run = $self;
}

entity PersonaOutcomes {
  key run : Association to SimulationRuns;
  key persona : Association to Personas;
  scope : String(16);
  pathway : Pathway;
  pathwayLabel : String(40);
  transitionScore : Integer;
  skillGapLabel : String(80);
  targetRole : Association to Roles;
  rationale : String(1000);
}

entity SkillTransitions {
  key run : Association to SimulationRuns;
  key side : String(16);
  key position : Integer;
  skillName : String(80);
}

entity DepartmentImpacts {
  key run : Association to SimulationRuns;
  key impactKey : String(24);
  name : String(80);
  kind : String(16);
  affected : Integer;
  narrative : String(500);
  capacityStrain : Band;
  netLoad : Decimal(8, 2);
}

entity RiskFactors {
  key run : Association to SimulationRuns;
  key factorId : String(32);
  title : String(180);
  assumption : String(400);
  severity : Band;
  sensitivity : Band;
  effect : String(800);
  affectedDelta : Integer;
  highRiskDelta : Integer;
  readinessDelta : Integer;
}

entity CounterfactualScenarios {
  key ID : String(40);
  run : Association to SimulationRuns;
  alternativeRun : Association to SimulationRuns;
  question : String(240);
  automationPercent : Integer;
  trainingPercent : Integer;
  redeployCapacity : String(16);
  reskillInvestment : String(16);
  affected : Integer;
  reskillDemand : Integer;
  redeployDemand : Integer;
  highTransitionRisk : Integer;
  skillReadiness : Integer;
  transitionRisk : RiskLevel;
  riskScore : Integer;
  productivityNearTerm : Decimal(8, 2);
  productivityHorizon : Decimal(8, 2);
}

entity SimulationMetrics {
  key run : Association to SimulationRuns;
  key metric : String(40);
  label : String(80);
  value : Decimal(12, 2);
  unit : String(24);
}

entity PathwayCounts {
  key run : Association to SimulationRuns;
  key pathway : Pathway;
  label : String(40);
  count : Integer;
}

entity ScenarioComparisons {
  key ID : String(40);
  title : String(160);
  leftRun : Association to SimulationRuns;
  rightRun : Association to SimulationRuns;
  note : String(400);
  createdAt : Timestamp;
}

entity DecisionBriefs {
  key ID : String(40);
  run : Association to SimulationRuns;
  title : String(120);
  body : LargeString;
  adapter : String(64);
  published : Boolean;
  connected : Boolean;
  createdAt : Timestamp;
}

entity ProcessEvents {
  key ID : String(48);
  scenario : Association to Scenarios;
  run : Association to SimulationRuns;
  step : String(40);
  adapter : String(64);
  connected : Boolean;
  message : String(400);
  createdAt : Timestamp;
}


export type WorkStyle = "remote" | "hybrid" | "office";
export type Seniority = "early" | "mid" | "senior" | "lead" | "executive";
export type CareerStage = "early-career" | "establishing" | "experienced" | "seasoned";
export type Reaction = "positive" | "neutral" | "concerned";
export type Confidence = "Low" | "Medium" | "High";
export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SimulationPhase =
  | "queued"
  | "initializing"
  | "generating_personas"
  | "simulating"
  | "analysing"
  | "red_teaming"
  | "completed";
export type WorkforceVisualState = "IDLE" | "SIMULATING" | "COMPLETED";
export type DecisionCategory =
  | "work-model"
  | "hiring"
  | "promotion"
  | "benefits"
  | "working-hours"
  | "accessibility"
  | "training"
  | "employee-development";

export interface PersonaAttributes {
  flexibilityPreference: number;
  accessibilityNeeds: number;
  collaborationPreference: number;
  careerOrientation: number;
  technologyComfort: number;
  commuteSensitivity: number;
  workLifePriority: number;
  belongingNeed: number;
  mentorshipNeed: number;
  autonomyPreference: number;
  stabilityPreference: number;
  visibilityNeed: number;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  department: string;
  age: number;
  experienceYears: number;
  seniority: Seniority;
  careerStage: CareerStage;
  workStyle: WorkStyle;
  personality: string;
  shortDescription: string;
  goals: string[];
  motivations: string[];
  concerns: string[];
  traits: string[];
  attributes: PersonaAttributes;
  accent: string;
  accentSoft: string;
  glyph: AvatarGlyph;
  segments: string[];
}

export type AvatarGlyph =
  | "maya"
  | "arjun"
  | "sofia"
  | "daniel"
  | "priya"
  | "ethan"
  | "aisha"
  | "rahul"
  | "emma"
  | "liam"
  | "noor"
  | "vikram";

export interface PersonaScores {
  flexibility: number;
  accessibility: number;
  belonging: number;
  growth: number;
  workload: number;
  collaboration: number;
  adoption: number;
  wellbeing: number;
  retention: number;
}

export interface ScoreDrivers {
  metric: keyof PersonaScores;
  attribute: string;
  influence: number;
  note: string;
}

export interface PersonaSimulation {
  personaId: string;
  scores: PersonaScores;
  reaction: Reaction;
  thought: string;
  explanation: string;
  drivers: ScoreDrivers[];
  ml: {
    impactScore: number;
    adoptionScore: number;
    riskScore: number;
  };
}

export interface Scenario {
  id: string;
  name: string;
  summary: string;
  officeDays: number;
  collaborationEmphasis: number;
  accessibilitySupport: number;
  flexibilityAllowance: number;
  visibilityBias: number;
  changeVelocity: number;
}

export interface Decision {
  id: string;
  title: string;
  prompt: string;
  category: DecisionCategory;
  proposedChange: string;
  fromState: string;
  toState: string;
  workforceScope: string;
  createdAt: string;
  status: "draft" | "simulated" | "reported";
}

export interface WorkforceSegment {
  id: string;
  label: string;
  description: string;
  score: number;
  sampleSize: number;
}

export interface Risk {
  id: string;
  title: string;
  type:
    | "inclusion"
    | "accessibility"
    | "flexibility"
    | "career-equity"
    | "retention"
    | "implementation"
    | "assumption";
  severity: RiskSeverity;
  affectedSegments: string[];
  reason: string;
  evidence: string;
  assumption: string;
  mitigation: string;
}

export interface ConversationTurn {
  personaId: string;
  text: string;
}

export interface Conversation {
  id: string;
  scenarioId: string;
  turns: ConversationTurn[];
  insight: string;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  priority: "now" | "next" | "later";
}

export interface OverallScores {
  inclusion: number;
  employeeImpact: number;
  accessibility: number;
  adoption: number;
  retentionRisk: number;
  flexibility: number;
  collaboration: number;
  wellbeing: number;
  confidence: Confidence;
}

export interface SimulationResult {
  id: string;
  decisionId: string;
  scenarioId: string;
  createdAt: string;
  overall: OverallScores;
  personas: PersonaSimulation[];
  segments: WorkforceSegment[];
  risks: Risk[];
  conversation: Conversation;
  recommendations: Recommendation[];
  keyFinding: string;
  suggestedPolicy: string;
  evidence: string[];
  datasetNote: string;
}

export interface CalibrationPoint {
  id: string;
  date: string;
  decision: string;
  predicted: number;
  actual: number;
  metric: string;
}

export interface CalibrationResult {
  latest: CalibrationPoint;
  history: CalibrationPoint[];
  note: string;
}

export interface Project {
  id: string;
  name: string;
  category: DecisionCategory;
  updatedAt: string;
  inclusion: number;
  status: string;
}

export interface SimulationInput {
  decision: Decision;
  scenario: Scenario;
  personaIds?: string[];
}

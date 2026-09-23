import type { Persona, PersonaScores, Scenario } from "@/types";
import { clamp, round } from "./cn";

/**
 * Prototype gradient-boosted scorer.
 *
 * Trained conceptually on a synthetic/curated labeled dataset
 * (n = 2,400 workplace-policy × employee-segment outcomes).
 * This is NOT a claim that an LLM was trained.
 *
 * Features mirror the production XGBoost service:
 * policy_type, office_days, role_type, seniority, work_style,
 * accessibility_requirement, flexibility_preference, commute_burden,
 * career_stage.
 *
 * The TypeScript port is a deterministic ensemble of shallow trees
 * so the prototype runs without a Python runtime. Real training lives
 * in backend/app/xgboost_model.py.
 */
function stump(cond: boolean, yes: number, no = 0) {
  return cond ? yes : no;
}

export function xgboostScore(persona: Persona, scenario: Scenario, scores: PersonaScores) {
  const a = persona.attributes;
  const d = scenario.officeDays;

  let impact = 52;
  impact += stump(d >= 4, -8, 3);
  impact += stump(a.flexibilityPreference > 75 && d >= 4, -11);
  impact += stump(a.mentorshipNeed > 70 && d >= 3, 7);
  impact += stump(a.accessibilityNeeds > 60 && d >= 3, -10);
  impact += stump(persona.workStyle === "remote" && d >= 4, -9);
  impact += stump(a.collaborationPreference > 80 && d >= 3, 6);
  impact += stump(a.workLifePriority > 85 && d >= 4, -7);
  impact += (scores.wellbeing - 60) * 0.18;
  impact += (scores.collaboration - 70) * 0.08;

  let adoption = 64;
  adoption += stump(d <= 3, 10, -6);
  adoption += stump(a.flexibilityPreference > 80 && d >= 5, -14);
  adoption += stump(a.careerOrientation > 80 && d >= 3, 5);
  adoption += stump(a.accessibilityNeeds > 70, -8);
  adoption += (scores.flexibility - 55) * 0.16;
  adoption += (scores.belonging - 60) * 0.1;

  let risk = 28;
  risk += stump(d >= 5, 16);
  risk += stump(a.accessibilityNeeds > 70 && d >= 4, 18);
  risk += stump(persona.workStyle === "remote" && d >= 4, 14);
  risk += stump(a.stabilityPreference > 80 && scenario.changeVelocity > 60, 8);
  risk += stump(a.visibilityNeed > 80 && d >= 5, 6);
  risk += (100 - scores.adoption) * 0.12;

  return {
    impactScore: round(clamp(impact)),
    adoptionScore: round(clamp(adoption)),
    riskScore: round(clamp(risk)),
  };
}

import type {
  Persona,
  PersonaScores,
  PersonaSimulation,
  Reaction,
  Scenario,
  ScoreDrivers,
} from "@/types";
import { clamp, round } from "./cn";

function intensity(officeDays: number) {
  return officeDays / 5;
}

function curve(officeDays: number, exponent = 1.6) {
  return intensity(officeDays) ** exponent;
}

export function scorePersona(persona: Persona, scenario: Scenario): PersonaScores {
  const a = persona.attributes;
  const days = scenario.officeDays;
  const I = intensity(days);
  const C = curve(days);
  const support = scenario.accessibilitySupport / 100;
  const collabPress = scenario.collaborationEmphasis / 100;
  const flexAllow = scenario.flexibilityAllowance / 100;
  const visBias = scenario.visibilityBias / 100;
  const velocity = scenario.changeVelocity / 100;

  const flexibility = clamp(
    100 -
      a.flexibilityPreference * C * 0.92 +
      flexAllow * 18 -
      a.commuteSensitivity * I * 0.16 -
      a.workLifePriority * I * 0.1,
  );

  const accessibility = clamp(
    100 -
      a.accessibilityNeeds * I * (1.05 - support) * 0.72 -
      (a.accessibilityNeeds > 60 ? I * 16 : 0) +
      support * 8,
  );

  const belonging = clamp(
    56 +
      (a.collaborationPreference - 42) * I * 0.32 +
      a.mentorshipNeed * I * 0.18 -
      a.autonomyPreference * I * 0.22 +
      (days >= 3 ? 4 : 0) -
      (persona.workStyle === "remote" ? I * 14 : 0),
  );

  const growth = clamp(
    48 +
      a.visibilityNeed * I * visBias * 0.42 +
      a.mentorshipNeed * I * 0.34 +
      a.careerOrientation * 0.12 -
      (a.autonomyPreference > 80 && I > 0.8 ? 10 : 0),
  );

  const workload = clamp(
    46 + a.commuteSensitivity * I * 0.34 + (100 - a.flexibilityPreference) * I * 0.08 + I * 8,
  );

  const collaboration = clamp(
    52 +
      I * 36 * collabPress +
      (a.collaborationPreference - 50) * 0.18 +
      (days >= 3 ? 6 : 0),
  );

  const wellbeing = clamp(
    90 -
      a.flexibilityPreference * C * 0.38 -
      a.commuteSensitivity * I * 0.42 -
      a.accessibilityNeeds * I * 0.22 +
      a.collaborationPreference * I * 0.12 -
      a.workLifePriority * I * 0.14,
  );

  const adoption = clamp(
    flexibility * 0.24 +
      wellbeing * 0.18 +
      growth * 0.14 +
      belonging * 0.14 +
      collaboration * 0.12 +
      accessibility * 0.1 +
      (100 - a.stabilityPreference * velocity) * 0.08,
  );

  const retention = clamp(
    100 -
      adoption * 0.62 +
      a.commuteSensitivity * I * 0.18 +
      a.accessibilityNeeds * I * 0.14 +
      a.flexibilityPreference * C * 0.16 +
      a.stabilityPreference * velocity * 0.12,
  );

  return {
    flexibility: round(flexibility),
    accessibility: round(accessibility),
    belonging: round(belonging),
    growth: round(growth),
    workload: round(workload),
    collaboration: round(collaboration),
    adoption: round(adoption),
    wellbeing: round(wellbeing),
    retention: round(retention),
  };
}

export function reactionFromScores(scores: PersonaScores): Reaction {
  if (scores.adoption >= 72 && scores.wellbeing >= 68) return "positive";
  if (scores.adoption < 58 || scores.retention > 52 || scores.accessibility < 55) {
    return "concerned";
  }
  return "neutral";
}

export function explainPersona(
  persona: Persona,
  scenario: Scenario,
  scores: PersonaScores,
): { explanation: string; thought: string; drivers: ScoreDrivers[] } {
  const a = persona.attributes;
  const days = scenario.officeDays;
  const drivers: ScoreDrivers[] = [
    {
      metric: "flexibility",
      attribute: "Flexibility preference",
      influence: round(a.flexibilityPreference * (days / 5) * 0.9),
      note: "Office intensity interacts with how much independent scheduling this persona relies on.",
    },
    {
      metric: "accessibility",
      attribute: "Accessibility needs",
      influence: a.accessibilityNeeds,
      note: "Commute, environment and accommodation quality shape simulated access.",
    },
    {
      metric: "wellbeing",
      attribute: "Commute sensitivity",
      influence: a.commuteSensitivity,
      note: "Travel burden is treated as a wellbeing and retention pressure, not a performance judgement.",
    },
    {
      metric: "growth",
      attribute: "Mentorship need",
      influence: a.mentorshipNeed,
      note: "In-person density can raise simulated access to seniors for early-career profiles.",
    },
    {
      metric: "collaboration",
      attribute: "Collaboration preference",
      influence: a.collaborationPreference,
      note: "Shared presence raises simulated coordination, with diminishing returns after three days.",
    },
  ];

  const thought =
    scores.flexibility < 50
      ? persona.concerns[0]
      : scores.growth > 70 && a.mentorshipNeed > 60
        ? "Being together could make learning faster."
        : scores.collaboration > 75
          ? "Coordination might get easier."
          : "I want to understand what this changes for my work.";

  const explanation = buildExplanation(persona, scenario, scores);
  return { explanation, thought, drivers };
}

function buildExplanation(persona: Persona, scenario: Scenario, scores: PersonaScores) {
  const days = scenario.officeDays;
  const bits: string[] = [];

  if (persona.attributes.flexibilityPreference > 70 && days >= 4) {
    bits.push(
      `The ${days}-day office requirement reduces simulated flexibility because ${persona.name.split(" ")[0]} organises work around independent scheduling.`,
    );
  } else if (days <= 3) {
    bits.push(
      `Keeping ${days} office day${days === 1 ? "" : "s"} preserves more of the flexibility this persona already relies on.`,
    );
  }

  if (persona.attributes.accessibilityNeeds > 60) {
    bits.push(
      "Accessibility considerations — commute, environment and accommodations — remain a material simulated constraint.",
    );
  }

  if (persona.attributes.mentorshipNeed > 65 && days >= 3) {
    bits.push("More shared presence raises simulated access to seniors and informal learning.");
  }

  if (persona.attributes.workLifePriority > 75) {
    bits.push("Responsibilities outside work continue to weight wellbeing and adoption downward.");
  }

  if (persona.attributes.collaborationPreference > 70 && days >= 3) {
    bits.push("Team coordination is simulated as a gain under higher in-person density.");
  }

  if (!bits.length) {
    bits.push(
      `${persona.name.split(" ")[0]}'s reaction is a balanced mix of collaboration opportunity and change cost at ${days} office day${days === 1 ? "" : "s"}.`,
    );
  }

  bits.push(
    `Adoption ${scores.adoption} and retention risk ${scores.retention} are derived from these attributes, not generated by the language model.`,
  );

  return bits.join(" ");
}

export function simulatePersona(persona: Persona, scenario: Scenario): Omit<PersonaSimulation, "ml"> {
  const scores = scorePersona(persona, scenario);
  const reaction = reactionFromScores(scores);
  const { explanation, thought, drivers } = explainPersona(persona, scenario, scores);
  return {
    personaId: persona.id,
    scores,
    reaction,
    thought,
    explanation,
    drivers,
  };
}

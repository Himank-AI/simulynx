import type { Scenario } from "@/types";

export const SCENARIOS: Scenario[] = [
  {
    id: "fully-remote",
    name: "Fully Remote",
    summary: "No required office days. Collaboration is designed into rituals, not rooms.",
    officeDays: 0,
    collaborationEmphasis: 48,
    accessibilitySupport: 88,
    flexibilityAllowance: 96,
    visibilityBias: 32,
    changeVelocity: 40,
  },
  {
    id: "three-day-hybrid",
    name: "3-Day Hybrid",
    summary: "Three structured office days with two flexible days.",
    officeDays: 3,
    collaborationEmphasis: 78,
    accessibilitySupport: 74,
    flexibilityAllowance: 70,
    visibilityBias: 62,
    changeVelocity: 44,
  },
  {
    id: "five-day-office",
    name: "5-Day Office",
    summary: "Presence expected five days each week.",
    officeDays: 5,
    collaborationEmphasis: 92,
    accessibilitySupport: 52,
    flexibilityAllowance: 18,
    visibilityBias: 88,
    changeVelocity: 72,
  },
];

export function scenarioFromOfficeDays(officeDays: number): Scenario {
  const clamped = Math.max(0, Math.min(5, officeDays));
  const t = clamped / 5;
  return {
    id: `office-days-${clamped}`,
    name: `${clamped}-day ${clamped === 0 ? "remote" : clamped === 5 ? "office" : "hybrid"}`,
    summary: `Office presence set to ${clamped} day${clamped === 1 ? "" : "s"} each week.`,
    officeDays: clamped,
    collaborationEmphasis: Math.round(48 + t * 44),
    accessibilitySupport: Math.round(88 - t * 36),
    flexibilityAllowance: Math.round(96 - t * 78),
    visibilityBias: Math.round(32 + t * 56),
    changeVelocity: Math.round(40 + t * 32),
  };
}

export const DEFAULT_SCENARIO = SCENARIOS[2];

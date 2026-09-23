import { DEMO_DECISION } from "@/data/decisions";
import { DEFAULT_SCENARIO, scenarioFromOfficeDays } from "@/data/scenarios";
import { runSimulation, PHASE_DURATION_MS, PHASE_META } from "@/lib/simulation";
import type { Decision, Scenario, SimulationPhase, SimulationResult } from "@/types";

export { PHASE_DURATION_MS, PHASE_META };

export const simulationService = {
  create(decision: Decision, scenario: Scenario = DEFAULT_SCENARIO): SimulationResult {
    return runSimulation({ decision, scenario });
  },
  demo(): SimulationResult {
    return runSimulation({ decision: DEMO_DECISION, scenario: DEFAULT_SCENARIO });
  },
  atOfficeDays(decision: Decision, officeDays: number): SimulationResult {
    return runSimulation({ decision, scenario: scenarioFromOfficeDays(officeDays) });
  },
};

export function nextPhase(phase: SimulationPhase): SimulationPhase | null {
  const order = PHASE_META.map((p) => p.id);
  const i = order.indexOf(phase);
  if (i < 0 || i >= order.length - 1) return null;
  return order[i + 1];
}

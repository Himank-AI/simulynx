import { runSimulation } from "@/lib/simulation";
import { SCENARIOS } from "@/data/scenarios";
import type { Decision, SimulationResult } from "@/types";

export const reportService = {
  build(decision: Decision, officeDays = 3): SimulationResult {
    const scenario = SCENARIOS.find((s) => s.officeDays === officeDays) ?? SCENARIOS[1];
    return runSimulation({ decision, scenario });
  },
};

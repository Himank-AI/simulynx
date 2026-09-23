import { BASE_RISKS } from "@/data/risks";
import { runSimulation } from "@/lib/simulation";
import { DEFAULT_SCENARIO } from "@/data/scenarios";
import type { Decision, Risk } from "@/types";

export const redTeamService = {
  catalogue(): Risk[] {
    return BASE_RISKS;
  },
  forDecision(decision: Decision, officeDays = 5): Risk[] {
    const scenario = { ...DEFAULT_SCENARIO, officeDays, id: `office-days-${officeDays}` };
    return runSimulation({ decision, scenario }).risks;
  },
};

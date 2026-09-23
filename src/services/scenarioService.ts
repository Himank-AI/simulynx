import { SCENARIOS, scenarioFromOfficeDays } from "@/data/scenarios";
import type { Scenario } from "@/types";

export const scenarioService = {
  list(): Scenario[] {
    return SCENARIOS;
  },
  fromOfficeDays(days: number): Scenario {
    return scenarioFromOfficeDays(days);
  },
};

import { compareScenarios } from "@/lib/simulation";
import type { Decision } from "@/types";

export const analyticsService = {
  compare(decision: Decision) {
    return compareScenarios(decision);
  },
};

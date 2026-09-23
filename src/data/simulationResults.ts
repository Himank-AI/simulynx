import { DEMO_DECISION } from "./decisions";
import { DEFAULT_SCENARIO } from "./scenarios";
import { runSimulation } from "@/lib/simulation";

export const DEMO_RESULT = runSimulation({
  decision: DEMO_DECISION,
  scenario: DEFAULT_SCENARIO,
});

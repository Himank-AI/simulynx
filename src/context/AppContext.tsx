"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_DECISION } from "@/data/decisions";
import { DEFAULT_SCENARIO, scenarioFromOfficeDays } from "@/data/scenarios";
import { simulationService } from "@/services/simulationService";
import type { Decision, Scenario, SimulationResult } from "@/types";

interface AppState {
  userName: string;
  decision: Decision;
  scenario: Scenario;
  result: SimulationResult;
  officeDays: number;
  setDecision: (d: Decision) => void;
  setOfficeDays: (n: number) => void;
  run: (decision?: Decision, days?: number) => SimulationResult;
}

const AppContext = createContext<AppState | null>(null);

const initial = simulationService.demo();

export function AppProvider({ children }: { children: ReactNode }) {
  const [decision, setDecision] = useState<Decision>(DEMO_DECISION);
  const [officeDays, setOfficeDaysState] = useState(5);
  const [result, setResult] = useState<SimulationResult>(initial);

  const scenario = useMemo(() => scenarioFromOfficeDays(officeDays), [officeDays]);

  const run = useCallback(
    (nextDecision?: Decision, days?: number) => {
      const d = nextDecision ?? decision;
      const n = days ?? officeDays;
      const res = simulationService.atOfficeDays(d, n);
      setDecision(d);
      setOfficeDaysState(n);
      setResult(res);
      return res;
    },
    [decision, officeDays],
  );

  const setOfficeDays = useCallback(
    (n: number) => {
      setOfficeDaysState(n);
      setResult(simulationService.atOfficeDays(decision, n));
    },
    [decision],
  );

  const value = useMemo(
    () => ({
      userName: "Alex",
      decision,
      scenario: officeDays === 5 ? DEFAULT_SCENARIO : scenario,
      result,
      officeDays,
      setDecision,
      setOfficeDays,
      run,
    }),
    [decision, scenario, result, officeDays, run, setOfficeDays],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PHASE_META } from "@/lib/simulation";
import type { SimulationPhase } from "@/types";
import { cn } from "@/lib/cn";

const CINEMA: Record<SimulationPhase, string> = {
  queued: "Simulation initializing...",
  initializing: "Loading digital workforce...",
  generating_personas: "Loading digital workforce...",
  simulating: "Simulating persona responses...",
  analysing: "Analysing workforce...",
  red_teaming: "Running red team...",
  completed: "Decision intelligence ready",
};

const CHECKS = [
  "Mapping employee perspectives",
  "Running scenario simulation",
  "Testing inclusion impact",
  "Stress-testing assumptions",
  "Generating decision intelligence",
];

export function SimulationProgress({
  phase,
  percent,
}: {
  phase: SimulationPhase;
  percent: number;
}) {
  const doneIndex = phase === "completed" ? CHECKS.length : Math.min(CHECKS.length, Math.floor(percent / 22));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet">{CINEMA[phase]}</p>
        <p className="text-sm tabular-nums text-ink">{Math.round(percent)}%</p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-violet to-cyan"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <ul className="mt-4 space-y-1.5 text-[12px] text-dim">
        {CHECKS.map((c, i) => (
          <li key={c} className={cn("flex items-center gap-2", i < doneIndex && "text-ink")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", i < doneIndex ? "bg-cyan" : "bg-white/20")} />
            {c}
          </li>
        ))}
      </ul>
      <ol className="mt-4 flex flex-wrap gap-2">
        {PHASE_META.map((p) => (
          <li
            key={p.id}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
              p.id === phase ? "bg-violet/20 text-ink" : "glass text-dim",
            )}
          >
            {p.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function useSimulationPlayback(active: boolean) {
  const [phase, setPhase] = useState<SimulationPhase>("queued");
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhase("completed");
      setPercent(100);
      return;
    }
    setPhase(PHASE_META[0].id);
    setPercent(0);
    const timers: number[] = [];
    const run = (index: number) => {
      const current = PHASE_META[index];
      if (!current) return;
      setPhase(current.id);
      setPercent(current.at);
      if (current.id === "completed") return;
      const wait = 900 + index * 420;
      timers.push(window.setTimeout(() => run(index + 1), wait));
    };
    run(0);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active]);

  return { phase, percent };
}

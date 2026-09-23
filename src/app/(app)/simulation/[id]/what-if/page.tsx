"use client";

import { useMemo, useState } from "react";
import { SimulationNav } from "@/components/simulation/SimulationNav";
import { LiveMetrics, ScenarioSlider } from "@/components/simulation/ScenarioSlider";
import { DigitalWorkforce } from "@/components/workforce/DigitalWorkforce";
import { simulationService } from "@/services/simulationService";
import { useApp } from "@/context/AppContext";
import { whatIfExplanation } from "@/lib/simulation";
import Link from "next/link";

export default function WhatIfPage() {
  const { decision, officeDays, setOfficeDays, result } = useApp();
  const [from] = useState(officeDays);
  const baseline = useMemo(() => simulationService.atOfficeDays(decision, from), [decision, from]);
  const explanation = whatIfExplanation(from, officeDays, baseline.overall, result.overall);
  const concerned = result.personas.filter((p) => p.reaction === "concerned").length;

  return (
    <div className="px-5 pb-16 pt-4">
      <SimulationNav />
      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-dim">What-if simulator</p>
      <h1 className="mt-2 font-display text-5xl md:text-7xl">What if?</h1>
      <p className="mt-3 max-w-xl text-muted">
        Move office days. Metrics, risks and persona reactions recompute from the same
        deterministic model — they do not jitter on re-render.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <ScenarioSlider value={officeDays} onChange={setOfficeDays} />
          <div className="glass rounded-[24px] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Why did this change?</p>
            <p className="mt-2 text-sm leading-relaxed">{explanation}</p>
            <p className="mt-3 text-sm text-muted">
              {concerned} personas currently simulate as concerned.
            </p>
          </div>
        </div>
        <LiveMetrics scores={result.overall} />
      </div>

      <div className="mt-10">
        <DigitalWorkforce
          simulations={result.personas}
          state="COMPLETED"
          title={`${officeDays}-DAY POLICY`}
          subtitle="Live recompute"
        />
      </div>

      <Link
        href="/simulation/sim-hybrid-office/analytics"
        className="btn-primary mt-8 inline-flex h-11 items-center rounded-full px-5 text-sm"
      >
        Compare scenarios
      </Link>
    </div>
  );
}

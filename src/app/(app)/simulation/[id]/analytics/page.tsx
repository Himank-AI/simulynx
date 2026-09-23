"use client";

import { SimulationNav } from "@/components/simulation/SimulationNav";
import { comparisonRowsFromResults, ScenarioComparison } from "@/components/charts/ScenarioComparison";
import { analyticsService } from "@/services/analyticsService";
import { useApp } from "@/context/AppContext";
import { MetricCard } from "@/components/ui/primitives";
import Link from "next/link";
import { useMemo } from "react";

export default function AnalyticsPage() {
  const { decision, result } = useApp();
  const compared = useMemo(() => analyticsService.compare(decision), [decision]);
  const rows = comparisonRowsFromResults(
    compared.map((c) => ({ scenarioId: c.scenario.id, overall: c.result.overall })),
  );

  return (
    <div className="px-5 pb-16 pt-4">
      <SimulationNav />
      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-dim">Simulated impact</p>
      <h1 className="mt-2 font-display text-5xl">Not one score. Many experiences.</h1>
      <p className="mt-3 max-w-xl text-muted">
        Overall {result.overall.inclusion} conceals the split. Early career and accessibility-sensitive
        groups are not the same simulation.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {result.segments.map((s) => (
          <MetricCard key={s.id} label={s.label} value={s.score} hint={`${s.sampleSize} personas`} />
        ))}
      </div>

      <div className="mt-10">
        <ScenarioComparison rows={rows} />
      </div>

      <Link
        href="/simulation/sim-hybrid-office/report"
        className="btn-primary mt-8 inline-flex h-11 items-center rounded-full px-5 text-sm"
      >
        Open decision intelligence
      </Link>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DigitalWorkforce } from "@/components/workforce/DigitalWorkforce";
import { SimulationProgress, useSimulationPlayback } from "@/components/simulation/SimulationProgress";
import { SimulationNav } from "@/components/simulation/SimulationNav";
import { MetricCard } from "@/components/ui/primitives";
import { useApp } from "@/context/AppContext";

export default function SimulationPage() {
  const { result, decision } = useApp();
  const { phase, percent } = useSimulationPlayback(true);
  const visual =
    phase === "completed" ? "COMPLETED" : phase === "queued" || phase === "initializing" ? "IDLE" : "SIMULATING";
  const progress = percent / 100;
  const top = useMemo(() => result.overall, [result]);

  return (
    <div className="px-5 pb-16 pt-4">
      <SimulationNav />
      <div className="mt-6 max-w-3xl">
        <SimulationProgress phase={phase} percent={percent} />
      </div>
      <h1 className="mt-8 font-display text-4xl md:text-6xl">
        {phase === "completed" ? "Workforce has responded" : "Simulation in progress"}
      </h1>
      <p className="mt-2 text-muted">{decision.prompt}</p>

      <div className="mt-8">
        <DigitalWorkforce
          simulations={result.personas}
          state={visual}
          title={decision.title.toUpperCase()}
          subtitle={`${result.personas.length} personas reacting`}
          progress={progress}
        />
      </div>

      {phase === "completed" && (
        <section className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Inclusion" value={top.inclusion} />
          <MetricCard label="Employee impact" value={top.employeeImpact} />
          <MetricCard label="Accessibility" value={top.accessibility} />
          <MetricCard label="Adoption" value={top.adoption} />
          <MetricCard
            label="Retention risk"
            value={top.retentionRisk}
            tone={top.retentionRisk > 45 ? "risk" : "warn"}
          />
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/simulation/sim-hybrid-office/conversation"
          className="btn-primary inline-flex h-11 items-center rounded-full px-5 text-sm"
        >
          Watch conversation
        </Link>
        <Link
          href="/simulation/sim-hybrid-office/red-team"
          className="btn-ghost inline-flex h-11 items-center rounded-full px-5 text-sm"
        >
          Red-team this decision
        </Link>
      </div>
    </div>
  );
}

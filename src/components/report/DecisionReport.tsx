"use client";

import Link from "next/link";
import type { SimulationResult } from "@/types";
import { Disclaimer } from "@/components/ui/primitives";

export function DecisionReport({ result }: { result: SimulationResult }) {
  return (
    <article className="glass rounded-[32px] p-8 md:p-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Decision Intelligence</p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]">
        Decision
        <br />
        Intelligence
      </h1>
      <p className="mt-4 text-sm uppercase tracking-[0.16em] text-dim">Proposed policy</p>
      <p className="mt-1 font-display text-3xl text-violet">{result.suggestedPolicy}</p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-dim">
            Simulated workforce impact
          </p>
          <p className="mt-2 font-display text-6xl">{result.overall.inclusion}</p>
          <p className="text-muted">/ 100</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Key insight</p>
          <p className="mt-2 text-lg leading-relaxed">{result.keyFinding}</p>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Risks</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>Accessibility accommodations</li>
          <li>Role-specific requirements</li>
          <li>Employee transition period</li>
        </ul>
      </div>

      <div className="mt-10 rounded-[24px] bg-white/5 p-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Next step</p>
        <p className="mt-2 text-lg">
          Validate with a representative employee sample before implementation.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/calibration"
          className="btn-primary inline-flex h-11 items-center rounded-full px-5 text-sm"
        >
          Simulation vs reality
        </Link>
        <Link
          href="/simulation/sim-hybrid-office/what-if"
          className="btn-ghost inline-flex h-11 items-center rounded-full px-5 text-sm"
        >
          Adjust the policy
        </Link>
      </div>
      <Disclaimer className="mt-8" />
    </article>
  );
}

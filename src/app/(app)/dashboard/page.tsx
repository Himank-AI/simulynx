"use client";

import Link from "next/link";
import { DecisionCategoryGrid, DecisionInput } from "@/components/decision/DecisionInput";
import { DigitalWorkforce } from "@/components/workforce/DigitalWorkforce";
import { useApp } from "@/context/AppContext";

export default function DashboardPage() {
  const { result } = useApp();

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-dim">Northstar Labs · People</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Good evening, Alex.</h1>
      <p className="mt-8 font-display text-4xl leading-[0.95] md:text-6xl">
        What workforce
        <br />
        decision are you
        <br />
        making?
      </p>
      <div className="mt-8 max-w-3xl">
        <DecisionInput />
      </div>
      <div className="mt-8 max-w-4xl">
        <DecisionCategoryGrid selected="work-model" />
      </div>

      <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active Digital Workforces", "3"],
          ["Personas", "1,248"],
          ["Scenarios Tested", "36"],
          ["Decisions Simulated", "12"],
        ].map(([k, v]) => (
          <div key={k} className="glass rounded-[24px] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{k}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Living system</p>
            <h2 className="mt-1 font-display text-3xl">Digital Workforce</h2>
          </div>
          <Link href="/workforce" className="text-sm text-violet">
            Open ecosystem
          </Link>
        </div>
        <div className="mt-6">
          <DigitalWorkforce
            simulations={result.personas}
            state="IDLE"
            title="WORKFORCE"
            subtitle="1,248 PERSONAS"
          />
        </div>
      </section>
    </div>
  );
}

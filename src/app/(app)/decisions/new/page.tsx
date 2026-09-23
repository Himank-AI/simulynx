"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DecisionCategoryGrid } from "@/components/decision/DecisionInput";
import { WORKFORCE_SCOPES } from "@/data/decisions";
import { SCENARIOS } from "@/data/scenarios";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";

export default function NewDecisionPage() {
  const router = useRouter();
  const { run, setDecision, decision } = useApp();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("work-model");
  const [prompt, setPrompt] = useState("Move from hybrid to 5-day office.");
  const [scope, setScope] = useState("Entire workforce");
  const [scenario, setScenario] = useState("five-day-office");

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        Step {step} of 4
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-violet" style={{ width: `${step * 25}%` }} />
      </div>

      {step === 1 && (
        <section className="mt-8">
          <h1 className="font-display text-4xl">What are you changing?</h1>
          <div className="mt-6">
            <DecisionCategoryGrid selected={category} onSelect={setCategory} />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8">
          <h1 className="font-display text-4xl">What are you considering?</h1>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="glass mt-6 w-full rounded-[24px] p-5 text-lg outline-none"
          />
        </section>
      )}

      {step === 3 && (
        <section className="mt-8">
          <h1 className="font-display text-4xl">Choose workforce</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {WORKFORCE_SCOPES.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "glass rounded-[22px] px-4 py-4 text-left",
                  scope === s && "shadow-[0_0_0_1px_#8b5cf6]",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-8">
          <h1 className="font-display text-4xl">Choose scenarios</h1>
          <div className="mt-6 grid gap-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={cn(
                  "glass rounded-[22px] px-5 py-4 text-left",
                  scenario === s.id && "shadow-[0_0_0_1px_#8b5cf6]",
                )}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted">{s.summary}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          className="h-11 rounded-full px-5 text-sm text-muted"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="btn-primary h-11 rounded-full px-6 text-sm"
          onClick={() => {
            if (step < 4) {
              setStep((s) => s + 1);
              return;
            }
            const days = SCENARIOS.find((s) => s.id === scenario)?.officeDays ?? 5;
            setDecision({
              ...decision,
              prompt,
              proposedChange: prompt,
              category: category as typeof decision.category,
              workforceScope: scope,
            });
            run(
              {
                ...decision,
                prompt,
                proposedChange: prompt,
                category: category as typeof decision.category,
                workforceScope: scope,
              },
              days,
            );
            router.push("/simulation/sim-hybrid-office");
          }}
        >
          {step < 4 ? "Continue" : "Simulate"}
        </button>
      </div>
    </div>
  );
}

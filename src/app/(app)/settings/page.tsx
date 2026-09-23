"use client";

import { Disclaimer } from "@/components/ui/primitives";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl">Principles</h1>
      <p className="mt-3 text-muted">
        Simulynx supports decisions. It does not make employment decisions about individuals.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        {[
          "Never rank real employees.",
          "Never recommend firing employees.",
          "Never automatically reject candidates.",
          "Never infer sensitive traits or protected characteristics.",
          "Never make promotion decisions about specific people.",
          "Use synthetic personas and aggregated groups only.",
        ].map((rule) => (
          <li key={rule} className="glass rounded-[20px] px-5 py-4">
            {rule}
          </li>
        ))}
      </ul>
      <div className="glass mt-10 rounded-[24px] p-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">How scoring works</p>
        <p className="mt-3 text-sm leading-relaxed">
          We use an LLM for reasoning and multi-agent interaction, while structured ML models
          and deterministic scoring handle quantitative evaluation. The prototype XGBoost layer
          is trained on synthetic/curated labeled scenarios — not on your people, and not by
          training a language model from scratch.
        </p>
      </div>
      <Disclaimer className="mt-8" />
    </div>
  );
}

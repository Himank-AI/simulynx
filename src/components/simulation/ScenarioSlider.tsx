"use client";

import { ImpactMeter, MetricCard } from "@/components/ui/primitives";
import type { OverallScores } from "@/types";

export function ScenarioSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="glass rounded-[28px] p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Office days</p>
          <p className="mt-1 font-display text-4xl">{value}</p>
        </div>
        <p className="text-sm text-muted">0 remote · 5 full presence</p>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        step={1}
        value={value}
        aria-label="Office days per week"
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-6 w-full"
      />
      <div className="mt-2 flex justify-between text-[11px] text-dim">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

export function LiveMetrics({ scores }: { scores: OverallScores }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard label="Inclusion" value={scores.inclusion} tone={scores.inclusion >= 75 ? "good" : "warn"} />
      <MetricCard label="Adoption" value={scores.adoption} />
      <MetricCard label="Flexibility" value={scores.flexibility} />
      <MetricCard label="Collaboration" value={scores.collaboration} tone="good" />
      <MetricCard label="Accessibility" value={scores.accessibility} />
      <MetricCard
        label="Retention risk"
        value={scores.retentionRisk}
        tone={scores.retentionRisk > 45 ? "risk" : "default"}
      />
    </div>
  );
}

export function ScoreStack({ scores }: { scores: OverallScores }) {
  return (
    <div className="glass space-y-3 rounded-[24px] p-5">
      <ImpactMeter label="Inclusion" value={scores.inclusion} />
      <ImpactMeter label="Adoption" value={scores.adoption} color="#6366f1" />
      <ImpactMeter label="Flexibility" value={scores.flexibility} color="#22d3ee" />
      <ImpactMeter label="Collaboration" value={scores.collaboration} color="#a78bfa" />
      <ImpactMeter label="Accessibility" value={scores.accessibility} color="#22c55e" />
      <ImpactMeter label="Retention risk" value={scores.retentionRisk} color="#ef4444" />
    </div>
  );
}

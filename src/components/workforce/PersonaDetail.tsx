"use client";

import Link from "next/link";
import type { Persona, PersonaSimulation } from "@/types";
import { PersonaAvatar } from "./PersonaAvatar";
import { ImpactMeter } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const reactionCopy = {
  positive: { label: "Positive", tone: "text-mint" },
  neutral: { label: "Neutral", tone: "text-muted" },
  concerned: { label: "Concerned", tone: "text-amber" },
};

export function PersonaDetail({
  persona,
  sim,
  compact,
}: {
  persona: Persona;
  sim?: PersonaSimulation;
  compact?: boolean;
}) {
  const reaction = sim?.reaction ?? "neutral";

  return (
    <div>
      <div className="flex items-center gap-3">
        <PersonaAvatar glyph={persona.glyph} size={compact ? 52 : 72} reaction={sim?.reaction} />
        <div>
          <p className="font-display text-xl leading-tight tracking-[0.06em] uppercase">
            {persona.name.split(" ")[0]}
          </p>
          <p className="text-sm text-muted">
            {persona.role} · {persona.age}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {persona.traits.map((t) => (
          <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-ink">
            {t}
          </span>
        ))}
      </div>

      {sim && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Status</p>
          <p className={cn("mt-1 text-sm font-medium", reactionCopy[reaction].tone)}>
            ● {reactionCopy[reaction].label.toUpperCase()}
          </p>
        </div>
      )}

      {sim && (
        <div className="mt-5 space-y-3">
          <ImpactMeter label="Flexibility" value={sim.scores.flexibility} />
          <ImpactMeter label="Wellbeing" value={sim.scores.wellbeing} color="#22d3ee" />
          <ImpactMeter label="Belonging" value={sim.scores.belonging} color="#a78bfa" />
          <ImpactMeter label="Adoption" value={sim.scores.adoption} color="#6366f1" />
          <ImpactMeter label="Retention risk" value={sim.scores.retention} color="#ef4444" />
        </div>
      )}

      {sim && (
        <div className="mt-5 rounded-2xl bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Why?</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{sim.explanation}</p>
        </div>
      )}

      <div className={cn("mt-5 flex gap-2", compact && "flex-col")}>
        <Link
          href={`/workforce/${persona.id}`}
          className="btn-ghost inline-flex h-10 items-center justify-center rounded-full px-4 text-sm"
        >
          Open profile
        </Link>
        <Link
          href="/simulation/sim-hybrid-office/conversation"
          className="btn-primary inline-flex h-10 items-center justify-center rounded-full px-4 text-sm"
        >
          Watch conversation →
        </Link>
      </div>
    </div>
  );
}

export function PersonaCard({ persona, sim }: { persona: Persona; sim?: PersonaSimulation }) {
  return (
    <Link
      href={`/workforce/${persona.id}`}
      className="glass block rounded-[24px] p-5 transition hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <PersonaAvatar glyph={persona.glyph} size={48} reaction={sim?.reaction} />
        <div>
          <p className="font-medium">{persona.name}</p>
          <p className="text-sm text-muted">{persona.role}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{persona.shortDescription}</p>
    </Link>
  );
}

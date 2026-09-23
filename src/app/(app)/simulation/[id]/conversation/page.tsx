"use client";

import { ConversationPanel } from "@/components/simulation/ConversationPanel";
import { SimulationNav } from "@/components/simulation/SimulationNav";
import { useApp } from "@/context/AppContext";
import { PERSONAS } from "@/data/personas";
import { PersonaAvatar } from "@/components/workforce/PersonaAvatar";
import Link from "next/link";

export default function ConversationPage() {
  const { result } = useApp();
  const speakers = result.conversation.turns
    .map((t) => PERSONAS.find((p) => p.id === t.personaId))
    .filter(Boolean);

  return (
    <div className="px-5 pb-16 pt-4">
      <SimulationNav />
      <div className="mx-auto mt-8 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-dim">Persona interaction</p>
        <h1 className="mt-2 font-display text-5xl">The workforce talks back</h1>
        <p className="mt-3 text-muted">
          A simulated conversation among personas. This is reasoning, not a vote, and not a
          ranking of real people.
        </p>
        <div className="mt-6 flex -space-x-2">
          {speakers.map((p) =>
            p ? <PersonaAvatar key={p.id} glyph={p.glyph} size={36} /> : null,
          )}
        </div>
        <div className="mt-8">
          <ConversationPanel conversation={result.conversation} />
        </div>
        <Link
          href="/simulation/sim-hybrid-office/red-team"
          className="btn-primary mt-8 inline-flex h-11 items-center rounded-full px-5 text-sm"
        >
          Challenge this decision
        </Link>
      </div>
    </div>
  );
}

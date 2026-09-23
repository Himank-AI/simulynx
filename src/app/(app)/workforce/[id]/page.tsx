"use client";

import { use } from "react";
import Link from "next/link";
import { PERSONAS } from "@/data/personas";
import { PersonaAvatar } from "@/components/workforce/PersonaAvatar";
import { PersonaRadar } from "@/components/charts/PersonaRadar";
import { ImpactMeter } from "@/components/ui/primitives";
import { useApp } from "@/context/AppContext";
import { EmptyState } from "@/components/ui/primitives";

export default function PersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const persona = PERSONAS.find((p) => p.id === id);
  const { result } = useApp();
  const sim = result.personas.find((p) => p.personaId === id);

  if (!persona) {
    return <EmptyState title="Persona not found" body="This character is not in the current digital workforce." />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Link href="/workforce" className="text-sm text-muted">
          ← Digital Workforce
        </Link>
        <div className="mt-6 flex items-center gap-4">
          <PersonaAvatar glyph={persona.glyph} size={88} reaction={sim?.reaction} />
          <div>
            <h1 className="font-display text-5xl">{persona.name}</h1>
            <p className="mt-1 text-muted">
              {persona.role} · {persona.age} · {persona.experienceYears} years
            </p>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">{persona.personality}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {persona.traits.map((t) => (
            <span key={t} className="rounded-full bg-white/5 px-3 py-1 text-sm hairline">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Block title="Goals" items={persona.goals} />
          <Block title="Motivations" items={persona.motivations} />
          <Block title="Concerns" items={persona.concerns} />
          <Block
            title="Work style"
            items={[
              `${persona.workStyle} · ${persona.careerStage.replace("-", " ")}`,
              persona.shortDescription,
            ]}
          />
        </div>

        {sim && (
          <div className="glass mt-10 rounded-[28px] p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Why this reaction?</p>
            <p className="mt-3 text-base leading-relaxed">{sim.explanation}</p>
            <ul className="mt-5 space-y-3">
              {sim.drivers.map((d) => (
                <li key={d.attribute}>
                  <ImpactMeter label={`${d.attribute} · ${d.metric}`} value={Math.min(100, d.influence)} />
                  <p className="mt-1 text-xs text-muted">{d.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted">
              Scores come from the attribute model and prototype XGBoost layer. The language
              model only explains them.
            </p>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="glass rounded-[28px] p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Behavioral map</p>
          {sim && <PersonaRadar scores={sim.scores} />}
        </div>
        {sim && (
          <div className="glass rounded-[28px] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Structured scores</p>
            <div className="mt-4 space-y-3">
              {Object.entries(sim.scores).map(([k, v]) => (
                <ImpactMeter key={k} label={k} value={v} />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              ML · impact {sim.ml.impactScore} · adoption {sim.ml.adoptionScore} · risk {sim.ml.riskScore}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{title}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

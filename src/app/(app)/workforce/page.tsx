"use client";

import { DigitalWorkforce } from "@/components/workforce/DigitalWorkforce";
import { useApp } from "@/context/AppContext";
import { Disclaimer } from "@/components/ui/primitives";

export default function WorkforcePage() {
  const { result } = useApp();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-dim">Hero experience</p>
      <h1 className="mt-2 font-display text-5xl">Digital Workforce</h1>
      <p className="mt-3 max-w-xl text-muted">
        Twelve synthetic personas. No real employees. Click a character to see how this
        decision is simulated to land.
      </p>
      <div className="mt-8">
        <DigitalWorkforce
          simulations={result.personas}
          state="IDLE"
          title="WORKFORCE"
          subtitle="1,248 PERSONAS"
        />
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Persona, PersonaSimulation, WorkforceVisualState } from "@/types";
import { PERSONAS } from "@/data/personas";
import { ConnectionLines } from "./ConnectionLines";
import { DecisionCore } from "./DecisionCore";
import { PersonaNode } from "./PersonaNode";
import { PersonaDetail } from "./PersonaDetail";
import { cn } from "@/lib/cn";

export function DigitalWorkforce({
  personas = PERSONAS,
  simulations = [],
  state = "IDLE",
  title = "DIGITAL WORKFORCE",
  subtitle,
  progress = 1,
  className,
  onSelectPersona,
}: {
  personas?: Persona[];
  simulations?: PersonaSimulation[];
  state?: WorkforceVisualState;
  title?: string;
  subtitle?: string;
  progress?: number;
  className?: string;
  onSelectPersona?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [thoughtIndex, setThoughtIndex] = useState(0);

  const simMap = useMemo(
    () => Object.fromEntries(simulations.map((s) => [s.personaId, s])),
    [simulations],
  );

  useEffect(() => {
    if (state !== "SIMULATING") return;
    const id = window.setInterval(() => {
      setThoughtIndex((n) => (n + 1) % Math.max(1, personas.length));
    }, 1100);
    return () => window.clearInterval(id);
  }, [state, personas.length]);

  const selectedPersona = personas.find((p) => p.id === selected);
  const visibleCount = Math.max(1, Math.round(progress * personas.length));

  return (
    <div className={cn("relative", className)}>
      <div
        className="relative mx-auto aspect-square w-full max-w-[820px] overflow-visible md:overflow-hidden md:rounded-[36px]"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMouse({
            x: (e.clientX - r.left) / r.width - 0.5,
            y: (e.clientY - r.top) / r.height - 0.5,
          });
        }}
        onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      >
        <div className="orbit-ring pointer-events-none absolute inset-0 rounded-[36px]" />
        <motion.div
          className="absolute inset-0"
          animate={{ x: mouse.x * 10, y: mouse.y * 10 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          <ConnectionLines
            personas={personas}
            activeId={selected}
            progress={state === "IDLE" ? 1 : progress}
            dimmed={Boolean(selected)}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <DecisionCore
              title={title === "DIGITAL WORKFORCE" ? "WORKFORCE" : title}
              subtitle={subtitle ?? "1,248 PERSONAS"}
              state={state}
            />
          </div>
          {personas.map((persona, i) => {
            const angle = (i / personas.length) * Math.PI * 2 - Math.PI / 2;
            const r = 38;
            const x = 50 + Math.cos(angle) * r;
            const y = 50 + Math.sin(angle) * r;
            const revealed = state === "IDLE" || i < visibleCount;
            if (!revealed) return null;
            return (
              <PersonaNode
                key={persona.id}
                persona={persona}
                sim={simMap[persona.id]}
                state={state}
                selected={selected === persona.id}
                dimmed={Boolean(selected) && selected !== persona.id}
                showThought={state === "SIMULATING" && thoughtIndex === i}
                delay={i * 0.06}
                onSelect={() => {
                  setSelected(persona.id);
                  onSelectPersona?.(persona.id);
                }}
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            );
          })}
        </motion.div>
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto pb-2 md:hidden no-scrollbar">
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className="glass min-w-[148px] rounded-2xl px-3 py-3 text-left"
          >
            <p className="text-sm font-medium">{p.name.split(" ")[0]}</p>
            <p className="text-xs text-muted">{p.role}</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedPersona && (
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            className="absolute right-3 top-3 z-30 w-[min(100%,340px)]"
          >
            <div className="glass relative rounded-[24px] p-5">
              <button
                type="button"
                aria-label="Close persona"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white/5"
                onClick={() => setSelected(null)}
              >
                <X size={16} />
              </button>
              <PersonaDetail persona={selectedPersona} sim={simMap[selectedPersona.id]} compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

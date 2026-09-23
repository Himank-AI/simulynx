"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { Persona, PersonaSimulation, WorkforceVisualState } from "@/types";
import { PersonaAvatar } from "./PersonaAvatar";
import { PersonaTooltip, ThoughtBubble } from "./ThoughtBubble";
import { cn } from "@/lib/cn";

export function PersonaNode({
  persona,
  sim,
  state,
  selected,
  dimmed,
  showThought,
  onSelect,
  style,
  delay = 0,
}: {
  persona: Persona;
  sim?: PersonaSimulation;
  state: WorkforceVisualState;
  selected: boolean;
  dimmed?: boolean;
  showThought: boolean;
  onSelect: () => void;
  style: CSSProperties;
  delay?: number;
}) {
  const [hover, setHover] = useState(false);
  const reaction = state === "IDLE" ? undefined : sim?.reaction;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`${persona.name}, ${persona.role}`}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: dimmed ? 0.35 : 1, scale: selected ? 1.12 : 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{
          duration: 4.2 + (delay % 1.4),
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className="relative flex flex-col items-center"
      >
        {hover && !showThought && (
          <PersonaTooltip
            name={persona.name.split(" ")[0]}
            role={persona.role}
            age={persona.age}
            concern={persona.concerns[0]?.slice(0, 42) ?? "Policy impact"}
            reaction={sim?.reaction}
            adoption={sim?.scores.adoption}
          />
        )}
        {showThought && sim?.thought && (
          <ThoughtBubble text={sim.thought} visible={showThought} />
        )}
        <div
          className={cn(
            "rounded-full p-0.5 transition-shadow",
            selected && "shadow-[0_0_0_4px_rgba(139,92,246,0.28)]",
          )}
        >
          <PersonaAvatar
            glyph={persona.glyph}
            size={58}
            reaction={reaction}
            pulse={state === "SIMULATING"}
          />
        </div>
        <div className="mt-2 text-center">
          <p className="text-[12px] font-medium text-ink">{persona.name.split(" ")[0]}</p>
          <p className="hidden text-[10px] text-dim sm:block">{persona.role}</p>
        </div>
      </motion.div>
    </motion.button>
  );
}

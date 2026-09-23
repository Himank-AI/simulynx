"use client";

import { motion } from "framer-motion";
import type { Reaction } from "@/types";
import { cn } from "@/lib/cn";

export function ThoughtBubble({
  text,
  visible,
  align = "center",
}: {
  text: string;
  visible: boolean;
  align?: "center" | "left" | "right";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={
        visible
          ? { opacity: 1, y: -4, scale: 1 }
          : { opacity: 0, y: 6, scale: 0.96 }
      }
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-none absolute -top-14 z-20 max-w-[190px] rounded-2xl px-3 py-2 text-[11px] leading-snug text-ink",
        "bg-[rgba(17,21,27,0.82)] backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        align === "left" && "left-0",
        align === "right" && "right-0",
        align === "center" && "left-1/2 -translate-x-1/2",
      )}
    >
      {text}
    </motion.div>
  );
}

export function StatusDot({ reaction }: { reaction?: Reaction }) {
  const color =
    reaction === "positive"
      ? "bg-mint"
      : reaction === "concerned"
        ? "bg-amber"
        : reaction === "neutral"
          ? "bg-white/30"
          : "bg-violet/40";
  return <span className={cn("h-1.5 w-1.5 rounded-full", color)} />;
}

export function PersonaTooltip({
  name,
  role,
  age,
  concern,
  reaction,
  adoption,
}: {
  name: string;
  role: string;
  age: number;
  concern: string;
  reaction?: string;
  adoption?: number;
}) {
  return (
    <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-48 -translate-x-1/2 rounded-2xl border border-white/10 bg-[rgba(17,21,27,0.92)] p-3 text-left shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.18em] text-dim">{name}</p>
      <p className="mt-1 text-[12px] text-muted">
        {role} · {age}
      </p>
      <p className="mt-2 text-[11px] text-ink">
        Concern: <span className="text-muted">{concern}</span>
      </p>
      {reaction && (
        <p className="mt-1 text-[11px]">
          Simulated reaction: <span className="text-amber">{reaction}</span>
        </p>
      )}
      {typeof adoption === "number" && (
        <p className="mt-1 text-[11px] text-muted">Adoption: {adoption}%</p>
      )}
    </div>
  );
}

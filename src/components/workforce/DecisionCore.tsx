"use client";

import { motion } from "framer-motion";
import type { WorkforceVisualState } from "@/types";

export function DecisionCore({
  title,
  subtitle,
  state,
}: {
  title: string;
  subtitle?: string;
  state: WorkforceVisualState;
}) {
  const simulating = state === "SIMULATING";
  const done = state === "COMPLETED";

  return (
    <div className="relative grid place-items-center">
      <div
        className="anim-spin-slower absolute h-64 w-64 rounded-full border border-white/8"
        style={{ boxShadow: "0 0 80px rgba(139,92,246,0.12)" }}
      />
      <div className="anim-spin-slow absolute h-52 w-52 rounded-full border border-dashed border-cyan/20" />
      <div className="absolute h-40 w-40 rounded-full border border-violet/25" />
      <motion.div
        className="anim-breathe absolute h-56 w-56 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.22), rgba(34,211,238,0.06) 46%, transparent 70%)",
        }}
        animate={
          simulating || done
            ? { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }
            : undefined
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="anim-spin-slow absolute h-52 w-52"
          style={{ animationDuration: `${28 + i * 6}s` }}
        >
          <span
            className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan/80"
            style={{ boxShadow: "0 0 8px #22d3ee" }}
          />
        </span>
      ))}
      <motion.div
        className="relative grid h-[158px] w-[158px] place-items-center rounded-full text-center"
        style={{
          background: "rgba(11,14,18,0.82)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: done
            ? "0 0 40px rgba(139,92,246,0.35)"
            : "0 0 24px rgba(139,92,246,0.18)",
        }}
        animate={simulating ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: 1.8, repeat: simulating ? Infinity : 0 }}
      >
        <div className="px-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-dim">
            {state === "IDLE" ? "Digital" : "Decision Core"}
          </p>
          <p className="mt-1 font-display text-[15px] leading-tight text-ink">{title}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-cyan/80">
            {subtitle ?? "1,248 personas"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

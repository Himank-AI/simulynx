"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={cn("tabular-nums", className)}
      initial={reduce ? false : { opacity: 0.35 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      <motion.span
        initial={reduce ? false : { y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "risk";
}) {
  const color =
    tone === "good"
      ? "text-mint"
      : tone === "warn"
        ? "text-amber"
        : tone === "risk"
          ? "text-risk"
          : "text-ink";
  return (
    <div className="glass rounded-[20px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{label}</p>
      <p className={cn("mt-2 font-display text-4xl", color)}>
        <AnimatedNumber value={value} />
      </p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function ImpactMeter({
  label,
  value,
  color = "#8b5cf6",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-ink">{label}</span>
        <span className="text-sm tabular-nums text-muted">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}66` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function RiskBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    LOW: "bg-mint/15 text-mint",
    MEDIUM: "bg-amber/15 text-amber",
    HIGH: "bg-orange-500/15 text-orange-300",
    CRITICAL: "bg-risk/15 text-risk",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        map[severity] ?? "bg-white/10 text-muted",
      )}
    >
      {severity}
    </span>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-dim", className)}>
      Simulated workforce insights are directional and should be validated with real
      employees and appropriate HR/legal processes. Simulynx supports decisions. It
      does not make employment decisions about individuals.
    </p>
  );
}

export function EmptyState({
  title,
  body,
  actionHref = "/decisions/new",
  actionLabel = "Create simulation",
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="glass grid place-items-center rounded-[24px] px-8 py-16 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{body}</p>
      <a href={actionHref} className="btn-primary mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm">
        {actionLabel}
      </a>
    </div>
  );
}

export function LoadingState({ label = "Analysing workforce" }: { label?: string }) {
  const steps = [
    "Mapping employee perspectives",
    "Running scenario simulation",
    "Testing inclusion impact",
    "Stress-testing assumptions",
    "Generating decision intelligence",
  ];
  return (
    <div className="glass max-w-md rounded-[24px] p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-violet">{label}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import type { Persona } from "@/types";
import { cn } from "@/lib/cn";

export function ConnectionLines({
  personas,
  activeId,
  progress = 0,
  cx = 50,
  cy = 50,
  radius = 38,
  dimmed = false,
}: {
  personas: Persona[];
  activeId?: string | null;
  progress?: number;
  cx?: number;
  cy?: number;
  radius?: number;
  dimmed?: boolean;
}) {
  const pts = useMemo(
    () =>
      personas.map((p, i) => {
        const angle = (i / personas.length) * Math.PI * 2 - Math.PI / 2;
        return {
          id: p.id,
          color: p.accent,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        };
      }),
    [personas, cx, cy, radius],
  );

  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {pts.map((p, i) => {
        const on = i / pts.length <= progress + 0.04;
        const active = activeId === p.id;
        return (
          <g key={p.id}>
            <line
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={active ? "#8b5cf6" : p.color}
              strokeWidth={active ? 0.42 : 0.18}
              strokeLinecap="round"
              className={cn(
                "anim-pulse-line",
                on ? "opacity-70" : "opacity-15",
                dimmed && !active && "opacity-20",
              )}
            />
            <line
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#22d3ee"
              strokeWidth={0.12}
              strokeDasharray="1.2 2.4"
              className={on && !dimmed ? "opacity-40" : "opacity-0"}
              style={{ animation: "dash-flow 4s linear infinite" }}
            />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="0.7" fill="#8b5cf6" />
    </svg>
  );
}

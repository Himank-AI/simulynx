"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalibrationResult } from "@/types";
import { AnimatedNumber } from "@/components/ui/primitives";

export function CalibrationChart({ data }: { data: CalibrationResult }) {
  const diff = Math.abs(data.latest.predicted - data.latest.actual);
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Predicted" value={data.latest.predicted} suffix="%" />
        <Stat label="Actual" value={data.latest.actual} suffix="%" />
        <Stat label="Difference" value={diff} suffix="%" />
      </div>
      <div className="glass mt-8 h-64 rounded-[28px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[50, 100]} />
            <Tooltip
              contentStyle={{
                background: "#11151B",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                color: "#F5F7FA",
              }}
            />
            <Area dataKey="predicted" stroke="#8B5CF6" fill="#8B5CF622" />
            <Area dataKey="actual" stroke="#22D3EE" fill="#22D3EE22" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 inline-flex rounded-full border border-mint/30 bg-mint/10 px-4 py-2 text-sm text-mint">
        Calibration updated
      </p>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="glass rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
      <p className="mt-2 font-display text-4xl">
        <AnimatedNumber value={value} />
        {suffix}
      </p>
    </div>
  );
}

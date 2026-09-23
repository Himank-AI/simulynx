"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationResult } from "@/types";
import { SCENARIOS } from "@/data/scenarios";

export function ScenarioComparison({
  rows,
}: {
  rows: { name: string; inclusion: number; adoption: number; flexibility: number; collaboration: number; risk: number }[];
}) {
  const strongest = [...rows].sort(
    (a, b) => b.inclusion + b.adoption - (a.inclusion + a.adoption) - (b.risk - a.risk),
  )[0];

  return (
    <div className="glass rounded-[28px] p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Scenario comparison · Simulated impact</p>
      <h3 className="mt-1 font-display text-2xl">Trade-offs, not a winner</h3>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#11151B",
                fontSize: 12,
                color: "#F5F7FA",
              }}
            />
            <Bar dataKey="inclusion" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="adoption" fill="#22D3EE" radius={[6, 6, 0, 0]} />
            <Bar dataKey="risk" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-dim">
            <tr>
              <th className="py-2">Scenario</th>
              <th>Inclusion</th>
              <th>Adoption</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/10">
                <td className="py-3 font-medium">{r.name}</td>
                <td>{r.inclusion}</td>
                <td>{r.adoption}</td>
                <td>{r.risk > 40 ? "High" : r.risk > 28 ? "Medium" : "Low"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {strongest && (
        <p className="mt-5 text-sm leading-relaxed text-muted">
          <span className="text-ink">{strongest.name}</span> shows the strongest simulated
          balance across the selected criteria. It is not universally “best” — collaboration,
          access and flexibility still trade off.
        </p>
      )}
    </div>
  );
}

export function comparisonRowsFromResults(
  results: { scenarioId: string; overall: SimulationResult["overall"] }[],
) {
  return results.map((r) => {
    const scenario = SCENARIOS.find((s) => s.id === r.scenarioId);
    return {
      name: scenario?.name ?? r.scenarioId,
      inclusion: r.overall.inclusion,
      adoption: r.overall.adoption,
      flexibility: r.overall.flexibility,
      collaboration: r.overall.collaboration,
      risk: r.overall.retentionRisk,
    };
  });
}

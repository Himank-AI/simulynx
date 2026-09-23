"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { PersonaScores } from "@/types";

export function PersonaRadar({ scores }: { scores: PersonaScores }) {
  const data = [
    { k: "Flexibility", v: scores.flexibility },
    { k: "Access", v: scores.accessibility },
    { k: "Belonging", v: scores.belonging },
    { k: "Growth", v: scores.growth },
    { k: "Wellbeing", v: scores.wellbeing },
    { k: "Collab", v: scores.collaboration },
  ];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="k" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
          <Radar dataKey="v" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.22} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

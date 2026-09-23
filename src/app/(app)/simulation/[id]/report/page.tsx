"use client";

import { DecisionReport } from "@/components/report/DecisionReport";
import { SimulationNav } from "@/components/simulation/SimulationNav";
import { reportService } from "@/services/reportService";
import { useApp } from "@/context/AppContext";

export default function ReportPage() {
  const { decision } = useApp();
  const result = reportService.build(decision, 3);

  return (
    <div className="px-5 pb-16 pt-4">
      <SimulationNav />
      <div className="mx-auto mt-8 max-w-3xl">
        <DecisionReport result={result} />
      </div>
    </div>
  );
}

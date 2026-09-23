"use client";

import { CalibrationChart } from "@/components/charts/CalibrationChart";
import { calibrationService } from "@/services/calibrationService";
import { Disclaimer } from "@/components/ui/primitives";

export default function CalibrationPage() {
  const data = calibrationService.get();
  return (
    <div className="pb-16">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Real-world calibration</p>
      <h1 className="mt-2 font-display text-5xl leading-[0.95] md:text-6xl">
        Simulation
        <br />
        vs
        <br />
        Reality
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Prototype labels from curated historical outcomes. Calibration updates scenario
        weights. It does not train an LLM and it does not score named employees.
      </p>
      <div className="mt-10">
        <CalibrationChart data={data} />
      </div>
      <div className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Previous simulations</p>
        <ul className="mt-4 space-y-3">
          {data.history.map((h) => (
            <li key={h.id} className="glass flex items-center justify-between rounded-[20px] px-5 py-4">
              <div>
                <p className="font-medium">{h.decision}</p>
                <p className="text-sm text-muted">{h.date}</p>
              </div>
              <p className="text-sm tabular-nums">
                {h.predicted}% → {h.actual}%
              </p>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed">
        We don&apos;t replace the workforce&apos;s voice. We help organizations hear the risks
        before they become reality.
      </p>
      <Disclaimer className="mt-6" />
    </div>
  );
}

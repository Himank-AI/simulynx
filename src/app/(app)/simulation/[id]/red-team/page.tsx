"use client";

import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { RedTeamCard } from "@/components/simulation/RedTeamCard";
import { SimulationNav } from "@/components/simulation/SimulationNav";
import { useApp } from "@/context/AppContext";
import Link from "next/link";

export default function RedTeamPage() {
  const { result } = useApp();
  const shown = result.risks.slice(0, 7);

  return (
    <div className="min-h-[80vh] px-5 py-4">
      <SimulationNav />
      <div className="mx-auto max-w-5xl pb-16 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Adversarial pass</p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] md:text-7xl">
              Try to break
              <br />
              this decision
            </h1>
          </div>
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="grid h-16 w-16 place-items-center rounded-full border border-risk/30 bg-risk/10"
          >
            <Shield className="text-risk" />
          </motion.div>
        </div>
        <p className="mt-6 max-w-xl text-muted">
          Challenge assumptions. Find overlooked groups. Identify failure scenarios. Red Team does
          not assume the policy is beneficial.
        </p>
        <p className="mt-4 font-display text-2xl">
          Red Team found <span className="text-risk">{shown.length}</span> risks
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {shown.map((risk, i) => (
            <RedTeamCard key={risk.id} risk={risk} index={i} />
          ))}
        </div>
        <Link
          href="/simulation/sim-hybrid-office/what-if"
          className="btn-primary mt-10 inline-flex h-11 items-center rounded-full px-5 text-sm"
        >
          What if we change the policy?
        </Link>
      </div>
    </div>
  );
}

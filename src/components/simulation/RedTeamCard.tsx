"use client";

import { motion } from "framer-motion";
import type { Risk } from "@/types";
import { RiskBadge } from "@/components/ui/primitives";

export function RedTeamCard({ risk, index }: { risk: Risk; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 * index, duration: 0.45 }}
      className="glass rounded-[24px] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-dim">
          {String(index + 1).padStart(2, "0")}
        </p>
        <RiskBadge severity={risk.severity} />
      </div>
      <h3 className="mt-3 font-display text-2xl">{risk.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{risk.reason}</p>
      <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-risk/80">Affected</p>
      <p className="mt-1 text-sm text-ink/80">{risk.affectedSegments.join(" · ")}</p>
      <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-dim">Evidence</p>
      <p className="mt-1 text-sm text-muted">{risk.evidence}</p>
      <p className="mt-3 text-xs italic text-dim">{risk.assumption}</p>
      <p className="mt-4 rounded-2xl bg-white/5 px-3 py-3 text-sm text-ink/85">
        <span className="text-risk/90">Mitigation · </span>
        {risk.mitigation}
      </p>
    </motion.article>
  );
}

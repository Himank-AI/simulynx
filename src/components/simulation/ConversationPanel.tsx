"use client";

import { motion } from "framer-motion";
import type { Conversation } from "@/types";
import { PERSONA_MAP } from "@/data/personas";
import { PersonaAvatar } from "@/components/workforce/PersonaAvatar";

export function ConversationPanel({ conversation }: { conversation: Conversation }) {
  return (
    <div className="space-y-4">
      {conversation.turns.map((turn, i) => {
        const persona = PERSONA_MAP[turn.personaId];
        if (!persona) return null;
        return (
          <motion.article
            key={`${turn.personaId}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * i, duration: 0.45 }}
            className="flex gap-3"
          >
            <PersonaAvatar glyph={persona.glyph} size={44} />
            <div className="glass rounded-[22px] px-4 py-3">
              <p className="text-[12px] font-medium text-ink">
                {persona.name.split(" ")[0]}
                <span className="ml-2 font-normal text-dim">{persona.role}</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">{turn.text}</p>
            </div>
          </motion.article>
        );
      })}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 * conversation.turns.length }}
        className="rounded-[24px] border border-violet/30 bg-violet/10 px-5 py-5 shadow-[0_0_40px_rgba(139,92,246,0.18)]"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan">AI Insight</p>
        <p className="mt-2 font-display text-xl leading-snug">{conversation.insight}</p>
      </motion.div>
    </div>
  );
}

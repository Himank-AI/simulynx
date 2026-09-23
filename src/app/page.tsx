"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PERSONAS } from "@/data/personas";
import { PersonaAvatar } from "@/components/workforce/PersonaAvatar";
import { Wordmark } from "@/components/layout/AppShell";

const orbit = [
  { href: "/workforce", label: "Personas" },
  { href: "/simulation/sim-hybrid-office/analytics", label: "Insights" },
  { href: "/decisions/new", label: "Scenarios" },
  { href: "/simulation/sim-hybrid-office/red-team", label: "Red Team" },
  { href: "/settings", label: "Inclusion" },
  { href: "/simulation/sim-hybrid-office/report", label: "Outcomes" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6">
        <Wordmark />
        <Link href="/login" className="text-sm text-muted hover:text-ink">
          Sign in
        </Link>
      </header>

      <main className="relative mx-auto flex min-h-[calc(100dvh-88px)] max-w-[1200px] flex-col items-center px-6 pb-20 pt-8">
        <p className="text-[11px] uppercase tracking-[0.32em] text-dim">Simulynx</p>
        <h1 className="mt-5 max-w-4xl text-center font-display text-[48px] leading-[0.92] md:text-[84px]">
          Your workforce.
          <br />
          Simulated.
        </h1>
        <p className="mt-6 max-w-lg text-center text-base text-muted md:text-lg">
          Inclusive decisions. Simulated before implementation. Explore the impact of
          workplace decisions before they become reality.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex h-12 items-center rounded-full px-6 text-sm font-medium"
          >
            Simulate a Decision
          </Link>
          <Link
            href="/workforce"
            className="btn-ghost inline-flex h-12 items-center rounded-full px-6 text-sm"
          >
            Explore Digital Workforce
          </Link>
        </div>

        <div className="relative mt-16 h-[420px] w-full max-w-[680px] md:h-[520px]">
          <div className="absolute left-1/2 top-1/2 z-10 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0b0e12]/80 py-8 text-center backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-[0.28em] text-dim">Digital</p>
            <p className="font-display text-xl">Workforce</p>
            <p className="mt-1 text-[10px] tracking-[0.16em] text-cyan/80">1,248 PERSONAS</p>
          </div>
          {PERSONAS.map((p, i) => {
            const angle = (i / PERSONAS.length) * Math.PI * 2 - Math.PI / 2;
            const r = 38;
            return (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  marginLeft: `${Math.cos(angle) * r}%`,
                  marginTop: `${Math.sin(angle) * r}%`,
                }}
                animate={{ y: [0, i % 2 === 0 ? -10 : 10, 0] }}
                transition={{ duration: 4.5 + (i % 5) * 0.3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <PersonaAvatar glyph={p.glyph} size={48} />
                </div>
              </motion.div>
            );
          })}
          {orbit.map((item, i) => {
            const angle = (i / orbit.length) * Math.PI * 2 - Math.PI / 6;
            const r = 22;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="glass absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[11px]"
                style={{
                  marginLeft: `${Math.cos(angle) * r}%`,
                  marginTop: `${Math.sin(angle) * r}%`,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

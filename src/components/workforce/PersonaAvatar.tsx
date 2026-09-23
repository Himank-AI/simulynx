"use client";

import { motion } from "framer-motion";
import type { AvatarGlyph, Reaction } from "@/types";
import { cn } from "@/lib/cn";

const faces: Record<
  AvatarGlyph,
  { bg: string; fg: string; mark: string }
> = {
  maya: { bg: "#2A2448", fg: "#8B5CF6", mark: "M" },
  arjun: { bg: "#0C2A2E", fg: "#22D3EE", mark: "A" },
  sofia: { bg: "#2A1A28", fg: "#E879F9", mark: "S" },
  daniel: { bg: "#1A2740", fg: "#60A5FA", mark: "D" },
  priya: { bg: "#2A1830", fg: "#F472B6", mark: "P" },
  ethan: { bg: "#162033", fg: "#60A5FA", mark: "E" },
  aisha: { bg: "#10261C", fg: "#22C55E", mark: "Ai" },
  rahul: { bg: "#2A1520", fg: "#F472B6", mark: "R" },
  emma: { bg: "#0E2430", fg: "#22D3EE", mark: "Em" },
  liam: { bg: "#14241C", fg: "#34D399", mark: "L" },
  noor: { bg: "#22184A", fg: "#A78BFA", mark: "N" },
  vikram: { bg: "#241C14", fg: "#D6B48A", mark: "V" },
};

function Face({ glyph, size }: { glyph: AvatarGlyph; size: number }) {
  const s = size;
  switch (glyph) {
    case "maya":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="24" r="12" fill="#F1D7C7" />
          <path d="M18 22c4-14 24-14 28 0-2 8-8 12-14 12s-12-4-14-12z" fill="#2A2438" />
          <circle cx="27" cy="26" r="1.4" fill="#1A1523" />
          <circle cx="37" cy="26" r="1.4" fill="#1A1523" />
          <path d="M28 32c2 2 6 2 8 0" stroke="#1A1523" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "arjun":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#E2B48A" />
          <path d="M20 22c2-10 22-10 24 2H20z" fill="#1C1917" />
          <rect x="22" y="24" width="20" height="4" rx="1" fill="#111" opacity=".55" />
          <circle cx="27" cy="28" r="1.3" fill="#111" />
          <circle cx="37" cy="28" r="1.3" fill="#111" />
        </svg>
      );
    case "sofia":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="25" r="12" fill="#E8C3A8" />
          <path d="M16 24c6-16 26-16 32 0-6 12-10 16-16 16s-10-4-16-16z" fill="#4A2C23" />
          <circle cx="27" cy="26" r="1.3" fill="#2B1A14" />
          <circle cx="37" cy="26" r="1.3" fill="#2B1A14" />
          <path d="M28 32c2.2 2.4 5.8 2.4 8 0" stroke="#2B1A14" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "daniel":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#C9956A" />
          <path d="M20 20c4-8 20-8 24 2H20z" fill="#1A120C" />
          <circle cx="27" cy="27" r="1.4" fill="#1A120C" />
          <circle cx="37" cy="27" r="1.4" fill="#1A120C" />
          <path d="M29 33c1.6 1.6 4.4 1.6 6 0" stroke="#1A120C" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "priya":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="25" r="12" fill="#D7A074" />
          <path d="M18 26c3-16 25-16 28 0-8 10-20 10-28 0z" fill="#2B120C" />
          <circle cx="27" cy="26" r="1.3" fill="#2B120C" />
          <circle cx="37" cy="26" r="1.3" fill="#2B120C" />
          <path d="M22 20c8 6 12 6 20 0" stroke="#C45C26" strokeWidth="1.6" fill="none" />
        </svg>
      );
    case "ethan":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#E6C7A8" />
          <path d="M21 22h22c0 6-4 8-11 8s-11-2-11-8z" fill="#C9C1B6" />
          <circle cx="27" cy="27" r="1.3" fill="#2A2420" />
          <circle cx="37" cy="27" r="1.3" fill="#2A2420" />
          <path d="M24 23h16" stroke="#9A9288" strokeWidth="1" />
        </svg>
      );
    case "aisha":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#C48A5A" />
          <path d="M18 18c2 14 4 22 14 26 10-4 12-12 14-26-8-8-20-8-28 0z" fill="#1C1917" />
          <circle cx="27" cy="27" r="1.2" fill="#1C1917" />
          <circle cx="37" cy="27" r="1.2" fill="#1C1917" />
        </svg>
      );
    case "rahul":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#D7A06C" />
          <path d="M20 22c3-10 21-10 24 2H20z" fill="#3F2A1A" />
          <circle cx="27" cy="27" r="1.3" fill="#3F2A1A" />
          <circle cx="37" cy="27" r="1.3" fill="#3F2A1A" />
          <path d="M29 33h6" stroke="#3F2A1A" strokeWidth="1.2" />
        </svg>
      );
    case "emma":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="25" r="12" fill="#F0D5C0" />
          <path d="M20 22c6-14 20-12 24 2-8 4-16 4-24-2z" fill="#C9A36A" />
          <circle cx="27" cy="26" r="1.3" fill="#3A2A20" />
          <circle cx="37" cy="26" r="1.3" fill="#3A2A20" />
          <path d="M22 28c4 6 16 6 20 0" stroke="#3A2A20" strokeWidth="1.1" fill="none" opacity=".4" />
        </svg>
      );
    case "liam":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#E8C8A8" />
          <path d="M20 20c2-6 22-6 24 4H20z" fill="#5C4330" />
          <rect x="21" y="25" width="22" height="5" rx="2" fill="#1F2933" opacity=".7" />
          <circle cx="27" cy="28" r="1.2" fill="#fff" />
          <circle cx="37" cy="28" r="1.2" fill="#fff" />
        </svg>
      );
    case "noor":
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="25" r="12" fill="#E2B896" />
          <path d="M18 24c6-14 22-14 28 0-2 12-8 16-14 16s-12-4-14-16z" fill="#111827" />
          <circle cx="27" cy="26" r="1.3" fill="#111827" />
          <circle cx="37" cy="26" r="1.3" fill="#111827" />
          <path d="M29 32c1.5 1.6 4.5 1.6 6 0" stroke="#111827" strokeWidth="1.1" fill="none" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
          <circle cx="32" cy="26" r="12" fill="#E2C19A" />
          <path d="M20 22c2-8 22-8 24 3H20z" fill="#4B5563" />
          <circle cx="27" cy="27" r="1.3" fill="#1F2937" />
          <circle cx="37" cy="27" r="1.3" fill="#1F2937" />
          <path d="M26 22h12" stroke="#9CA3AF" strokeWidth="1" />
        </svg>
      );
  }
}

export function PersonaAvatar({
  glyph,
  size = 56,
  reaction,
  pulse,
  className,
}: {
  glyph: AvatarGlyph;
  size?: number;
  reaction?: Reaction;
  pulse?: boolean;
  className?: string;
}) {
  const face = faces[glyph];
  const ring =
    reaction === "positive"
      ? "#22C55E"
      : reaction === "concerned"
        ? "#F59E0B"
        : reaction === "neutral"
          ? "#9CA3AF"
          : face.fg;

  return (
    <motion.div
      className={cn("relative grid place-items-center rounded-full", className)}
      style={{ width: size, height: size, background: face.bg }}
      animate={pulse ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={pulse ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" } : undefined}
    >
      <span
        className="absolute inset-[-3px] rounded-full"
        style={{ boxShadow: `inset 0 0 0 1.5px ${ring}33` }}
      />
      {reaction && (
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#050608]"
          style={{ background: ring }}
        />
      )}
      <Face glyph={glyph} size={size} />
    </motion.div>
  );
}

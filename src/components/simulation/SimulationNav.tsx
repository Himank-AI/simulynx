"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/simulation/sim-hybrid-office", label: "Live" },
  { href: "/simulation/sim-hybrid-office/conversation", label: "Conversation" },
  { href: "/simulation/sim-hybrid-office/red-team", label: "Red Team" },
  { href: "/simulation/sim-hybrid-office/what-if", label: "What if" },
  { href: "/simulation/sim-hybrid-office/analytics", label: "Analytics" },
  { href: "/simulation/sim-hybrid-office/report", label: "Report" },
];

export function SimulationNav() {
  const path = usePathname();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12px]",
            path === l.href ? "bg-violet/20 text-ink" : "glass text-dim",
          )}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

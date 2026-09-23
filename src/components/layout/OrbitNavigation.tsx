"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Sparkles,
  Users,
  SlidersHorizontal,
  BarChart3,
  FileText,
  Home,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workforce", label: "Personas", icon: Users },
  { href: "/simulation/sim-hybrid-office", label: "Scenarios", icon: Sparkles },
  { href: "/simulation/sim-hybrid-office/analytics", label: "Insights", icon: BarChart3 },
  { href: "/simulation/sim-hybrid-office/red-team", label: "Red Team", icon: Shield },
  { href: "/simulation/sim-hybrid-office/what-if", label: "What if", icon: SlidersHorizontal },
  { href: "/simulation/sim-hybrid-office/report", label: "Outcomes", icon: FileText },
];

export function OrbitNavigation({ compact = false }: { compact?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className={cn("flex items-center gap-1", compact && "overflow-x-auto no-scrollbar")}>
      {items.map((item) => {
        const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition",
              active ? "bg-violet/20 text-ink" : "text-dim hover:text-ink",
            )}
          >
            <Icon size={13} />
            <span className={cn(compact && "hidden sm:inline")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  const mobile = items.slice(0, 5);
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/10 bg-[#0b0e12]/90 px-2 py-2 backdrop-blur md:hidden"
    >
      {mobile.map((item) => {
        const Icon = item.icon;
        const active = path === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
              active ? "text-violet" : "text-muted",
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

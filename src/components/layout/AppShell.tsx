"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Gauge,
  Home,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Disclaimer } from "@/components/ui/primitives";

const primary = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/workforce", label: "Digital Workforce", icon: Users },
  { href: "/simulation/sim-hybrid-office", label: "Simulations", icon: Sparkles, match: "/simulation" },
  { href: "/simulation/sim-hybrid-office/what-if", label: "Scenarios", icon: SlidersHorizontal },
  { href: "/simulation/sim-hybrid-office/red-team", label: "Red Team", icon: Shield },
  { href: "/simulation/sim-hybrid-office/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/simulation/sim-hybrid-office/report", label: "Reports", icon: FileText },
  { href: "/calibration", label: "Calibration", icon: Gauge },
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-violet/20 text-[11px] font-semibold text-violet ring-1 ring-violet/40">
        S
      </span>
      {!compact && (
        <span>
          <span className="block font-display text-[15px] tracking-[0.18em]">SIMULYNX</span>
          <span className="block text-[9px] uppercase tracking-[0.22em] text-dim">
            Workforce Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}

function isActive(path: string, href: string, match?: string) {
  if (href === "/dashboard") return path === "/dashboard";
  if (href === "/workforce") return path.startsWith("/workforce");
  if (href.endsWith("/what-if")) return path.includes("/what-if");
  if (href.endsWith("/red-team")) return path.includes("/red-team");
  if (href.endsWith("/analytics")) return path.includes("/analytics");
  if (href.endsWith("/report")) return path.includes("/report");
  if (href === "/calibration") return path.startsWith("/calibration");
  if (match === "/simulation") {
    return (
      path.startsWith("/simulation") &&
      !path.includes("/what-if") &&
      !path.includes("/red-team") &&
      !path.includes("/analytics") &&
      !path.includes("/report") &&
      !path.includes("/conversation")
    );
  }
  return path === href;
}

export function SideNav() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-white/10 bg-[#0b0e12]/70 px-4 py-6 backdrop-blur-xl md:flex">
      <Wordmark />
      <nav aria-label="Primary" className="mt-10 flex flex-1 flex-col gap-1">
        {primary.map((item) => {
          const active = isActive(path, item.href, item.match);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition",
                active ? "text-ink" : "text-dim hover:text-ink",
              )}
            >
              {active && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet/25 to-cyan/5" />
              )}
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-violet shadow-[0_0_10px_#8b5cf6]" />
              )}
              <Icon
                size={16}
                className={cn("relative z-10", active ? "text-violet" : "text-dim group-hover:text-violet")}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-dim hover:text-ink"
        >
          <Settings size={16} />
          Settings
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-dim hover:text-ink"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-violet/20 text-[10px] text-violet">
            AX
          </span>
          Profile
        </Link>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  const mobile = primary.slice(0, 5);
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/8 bg-[#0b0e12]/90 px-2 py-2 backdrop-blur-xl md:hidden"
    >
      {mobile.map((item) => {
        const Icon = item.icon;
        const active = isActive(path, item.href, item.match);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
              active ? "text-violet" : "text-dim",
            )}
          >
            <Icon size={16} />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const immersive = path.startsWith("/simulation");

  return (
    <div className="relative min-h-dvh pb-16 md:pb-0 md:pl-[232px]">
      <SideNav />
      <main className={immersive ? "relative z-20 px-0" : "relative z-20 mx-auto max-w-[1280px] px-5 py-8"}>
        {children}
      </main>
      {!immersive && (
        <footer className="relative z-20 mx-auto hidden max-w-[1280px] px-5 py-10 md:block">
          <Disclaimer />
        </footer>
      )}
      <BottomNav />
    </div>
  );
}

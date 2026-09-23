"use client";

import Link from "next/link";
import { PROJECTS } from "@/data/projects";

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="font-display text-5xl">Projects</h1>
      <p className="mt-2 text-muted">Simulated decisions across Northstar Labs.</p>
      <div className="mt-8 grid gap-3">
        {PROJECTS.map((p) => (
          <Link
            key={p.id}
            href={p.id === "dec-office-policy" ? "/simulation/sim-hybrid-office" : "/decisions/new"}
            className="glass flex items-center justify-between rounded-[24px] px-5 py-5"
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted">
                {p.status} · {p.updatedAt}
              </p>
            </div>
            <p className="font-display text-2xl">{p.inclusion}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

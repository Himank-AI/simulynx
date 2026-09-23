"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function DecisionInput({
  defaultValue = "Should we move from hybrid work to a 5-day office policy?",
}: {
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [focus, setFocus] = useState(false);
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/simulation/sim-hybrid-office");
      }}
      className="relative"
    >
      <label htmlFor="decision" className="sr-only">
        What workforce decision are you making today?
      </label>
      <div
        className={cn(
          "rounded-[28px] transition-shadow",
          focus && "shadow-[0_0_0_1px_rgba(139,92,246,0.55),0_0_32px_rgba(139,92,246,0.22)]",
        )}
      >
        <textarea
          id="decision"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          rows={3}
          placeholder="e.g. Should we move from hybrid work to a 5-day office policy?"
          className="glass w-full resize-none rounded-[28px] bg-transparent px-6 py-5 pr-48 text-lg leading-relaxed outline-none placeholder:text-dim"
        />
      </div>
      <button
        type="submit"
        className="btn-primary absolute bottom-4 right-4 inline-flex h-12 items-center gap-2 rounded-full px-5 text-[12px] font-medium tracking-[0.08em]"
      >
        Simulate decision
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export function DecisionCategoryGrid({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  const cats = [
    ["work-model", "🏢", "Work Model"],
    ["hiring", "👥", "Hiring"],
    ["promotion", "📈", "Promotion"],
    ["benefits", "💰", "Benefits"],
    ["working-hours", "🧑‍💻", "Working Hours"],
    ["accessibility", "♿", "Accessibility"],
    ["training", "🎓", "Training"],
    ["employee-development", "🌱", "Employee Development"],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cats.map(([id, icon, label]) => {
        const on = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect?.(id)}
            className={cn(
              "glass rounded-[22px] px-4 py-5 text-left transition hover:-translate-y-0.5",
              on && "shadow-[0_0_0_1px_#8b5cf6,0_0_24px_rgba(139,92,246,0.25)]",
            )}
          >
            <span className="text-xl">{icon}</span>
            <p className="mt-3 text-sm font-medium">{label}</p>
          </button>
        );
      })}
    </div>
  );
}

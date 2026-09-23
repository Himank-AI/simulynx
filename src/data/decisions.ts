import type { Decision, DecisionCategory } from "@/types";

export const DEMO_DECISION: Decision = {
  id: "dec-office-policy",
  title: "5-day office policy",
  prompt: "Should we move from hybrid work to a 5-day office policy?",
  category: "work-model",
  proposedChange: "Move from hybrid to 5-day office.",
  fromState: "Hybrid (2–3 days)",
  toState: "5-day office",
  workforceScope: "Entire workforce",
  createdAt: "2026-09-12T09:00:00.000Z",
  status: "simulated",
};

export const DECISION_CATEGORIES: {
  id: DecisionCategory;
  label: string;
  icon: string;
  blurb: string;
}[] = [
  { id: "work-model", label: "Work Model", icon: "🏢", blurb: "Where and how people work together." },
  { id: "hiring", label: "Hiring", icon: "👥", blurb: "Who you bring in, and from where." },
  { id: "promotion", label: "Promotion", icon: "📈", blurb: "How advancement is recognised." },
  { id: "benefits", label: "Benefits", icon: "💰", blurb: "Health, leave, and support." },
  { id: "working-hours", label: "Working Hours", icon: "🧑‍💻", blurb: "Time, load, and coverage." },
  { id: "accessibility", label: "Accessibility", icon: "♿", blurb: "Environment, tools, commute." },
  { id: "training", label: "Training", icon: "🎓", blurb: "Skills and learning access." },
  { id: "employee-development", label: "Employee Development", icon: "🌱", blurb: "Growth paths over time." },
];

export const WORKFORCE_SCOPES = [
  "Entire workforce",
  "Engineering",
  "Marketing",
  "Managers",
  "New hires",
  "Accessibility-sensitive group",
];

import type { CalibrationResult } from "@/types";

export const CALIBRATION: CalibrationResult = {
  latest: {
    id: "cal-2026-08",
    date: "Aug 2026",
    decision: "Hybrid meeting-core pilot",
    predicted: 78,
    actual: 74,
    metric: "Adoption",
  },
  history: [
    {
      id: "cal-2025-11",
      date: "Nov 2025",
      decision: "Core hours experiment",
      predicted: 81,
      actual: 79,
      metric: "Adoption",
    },
    {
      id: "cal-2026-02",
      date: "Feb 2026",
      decision: "Manager in-office guidance",
      predicted: 69,
      actual: 63,
      metric: "Adoption",
    },
    {
      id: "cal-2026-05",
      date: "May 2026",
      decision: "Accessibility stipend",
      predicted: 84,
      actual: 86,
      metric: "Inclusion",
    },
    {
      id: "cal-2026-08",
      date: "Aug 2026",
      decision: "Hybrid meeting-core pilot",
      predicted: 78,
      actual: 74,
      metric: "Adoption",
    },
  ],
  note: "Calibration uses anonymized historical outcomes supplied as prototype labels. It adjusts scenario weights; it does not train an LLM and it does not score named employees.",
};

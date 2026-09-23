import type { Conversation } from "@/types";

export const CONVERSATIONS: Conversation[] = [
  {
    id: "convo-five-day",
    scenarioId: "five-day-office",
    turns: [
      {
        personaId: "maya",
        text: "I'm concerned that five days in the office could reduce flexibility. A lot of my best design work happens in quiet stretches that a commute would cut into.",
      },
      {
        personaId: "daniel",
        text: "For me, being in the office could actually help because I'm still learning. I pick up judgement from sitting near people who have done this longer.",
      },
      {
        personaId: "priya",
        text: "Flexibility is important for managing responsibilities outside work. School hours and a five-day mandate are not theoretical for me — they collide.",
      },
      {
        personaId: "liam",
        text: "Collaboration could improve significantly. Cross-squad work still leaks time when we are never in the same room. That said, we cannot pretend the cost is even.",
      },
      {
        personaId: "aisha",
        text: "Accessibility needs to be considered. Office days are not a neutral setting. Commute, lighting, and layout change whether I can actually do the job.",
      },
    ],
    insight:
      "The workforce is divided primarily by career stage and flexibility requirements. Early-career personas simulate a learning gain; hybrid and accessibility-sensitive personas simulate a material cost.",
  },
  {
    id: "convo-hybrid",
    scenarioId: "three-day-hybrid",
    turns: [
      {
        personaId: "maya",
        text: "Three days I can design around. I would still protect two deep-work days — that is the difference between sustainable and performative presence.",
      },
      {
        personaId: "daniel",
        text: "If those three days are the days seniors are also in, I get the apprenticeship I need without asking everyone to relocate their lives.",
      },
      {
        personaId: "priya",
        text: "A known three-day rhythm is something I can plan childcare around. Surprise five-day presence is not.",
      },
      {
        personaId: "liam",
        text: "If we treat those three days as coordination days — not badge-swipe days — we get most of the collaboration return.",
      },
    ],
    insight:
      "A structured hybrid pattern concentrates simulated collaboration gains while leaving room for flexibility, caregiving, and access needs.",
  },
];

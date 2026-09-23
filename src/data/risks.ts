import type { Risk } from "@/types";

export const BASE_RISKS: Risk[] = [
  {
    id: "flex-gap",
    title: "Flexibility Gap",
    type: "flexibility",
    severity: "HIGH",
    affectedSegments: ["Hybrid-oriented", "Working parents", "Flexibility-sensitive"],
    reason: "High office intensity collides with personas who already organise work around independent scheduling.",
    evidence:
      "Maya, Priya and Emma show the steepest simulated drop in flexibility and wellbeing as office days approach five.",
    assumption:
      "Assumption: commute time is non-productive. This is a modelling choice, not an observed timesheet.",
    mitigation:
      "Pilot a 3-day coordination rhythm before a full mandate, with role-based exceptions.",
  },
  {
    id: "a11y-risk",
    title: "Accessibility Risk",
    type: "accessibility",
    severity: "CRITICAL",
    affectedSegments: ["Accessibility-sensitive"],
    reason: "Required presence can introduce commute, sensory and environmental barriers that a hybrid pattern currently absorbs.",
    evidence:
      "Aisha's accessibility score declines sharply under five-day presence; Kenji-like sensory load is represented in the accessibility-sensitive segment.",
    assumption:
      "The prototype does not infer medical conditions. Accessibility need is an explicit persona attribute.",
    mitigation:
      "Audit sites for access, fund commute alternatives, and keep remote as a reasonable adjustment — not an exception to beg for.",
  },
  {
    id: "retain-risk",
    title: "Retention Risk",
    type: "retention",
    severity: "HIGH",
    affectedSegments: ["Remote-oriented", "Retention-sensitive"],
    reason: "Experienced remote employees show lower simulated acceptance. For some, five days is a relocation by another name.",
    evidence:
      "Emma's adoption falls below 50 in the five-day scenario; XGBoost risk score flags remote + high commute burden.",
    assumption:
      "We do not predict that any individual will resign. This is a segment-level directional signal.",
    mitigation:
      "Grandfather true remote roles, and separate 'collaboration days' from 'everyone in the building'.",
  },
  {
    id: "career-equity",
    title: "Career Equity",
    type: "career-equity",
    severity: "MEDIUM",
    affectedSegments: ["Remote-oriented", "Career accelerators", "Visibility-sensitive"],
    reason: "Office-heavy policies can concentrate informal sponsorship around whoever is physically present.",
    evidence:
      "Rahul's visibility need is high; remote personas do not receive the same simulated growth lift.",
    assumption:
      "We assume proximity currently influences sponsorship. That is a hypothesis to validate, not a finding about named employees.",
    mitigation:
      "Make promotion evidence written and distributed. Do not let hallway time become the performance system.",
  },
  {
    id: "inclusion-split",
    title: "Inclusion Split by Career Stage",
    type: "inclusion",
    severity: "MEDIUM",
    affectedSegments: ["Early Career", "Working parents"],
    reason: "The same policy is simulated as a gift for mentorship-seekers and a penalty for caregivers.",
    evidence:
      "Daniel and Noor rise on growth; Priya and Maya fall on wellbeing. Mean scores hide the split.",
    assumption:
      "Mentorship is treated as correlated with presence. Teams can design mentorship without five-day mandates.",
    mitigation:
      "If learning is the goal, schedule overlapping office days for seniors and juniors rather than universal presence.",
  },
  {
    id: "implementation",
    title: "Implementation Friction",
    type: "implementation",
    severity: "MEDIUM",
    affectedSegments: ["Operations", "Managers", "Stability-sensitive"],
    reason: "A fast switch creates rollout noise: desk capacity, team norms, and manager discretion.",
    evidence:
      "Vikram's stability preference is the highest in the set; change velocity is elevated in the five-day scenario.",
    assumption:
      "Capacity constraints are estimated, not measured from this company's real estate data.",
    mitigation:
      "Phase by function, publish the exception path, and give managers a written playbook so discretion does not become inequity.",
  },
  {
    id: "hidden-assumption",
    title: "Hidden Assumption: Presence Equals Collaboration",
    type: "assumption",
    severity: "HIGH",
    affectedSegments: ["Entire simulated workforce"],
    reason: "The model rewards office days with collaboration points. That is a structural assumption, not proof.",
    evidence:
      "Collaboration scores rise almost linearly with office intensity across all personas.",
    assumption:
      "This is an assumption baked into scoring. Challenge it with meeting-quality and delivery data before treating it as fact.",
    mitigation:
      "Measure collaboration by outcomes (cycle time, incident load, decision latency), not badge swipes.",
  },
];

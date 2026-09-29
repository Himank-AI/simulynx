export const MODEL_LIMITS = [
  'Synthetic personas are not real employees and are not evaluations of any person.',
  'Outputs are model estimates for a stated scenario, not forecasts or guarantees.',
  'The model does not use compensation, performance ratings, or protected personal characteristics.',
  'Accessibility context is a work-design constraint only. It is not a scoring factor.',
  'This environment is not connected to SAP HANA Cloud, SAP Build Process Automation, Joule, or SAP Analytics Cloud.',
  'Simulynx does not select a workforce decision. That remains with the decision maker.',
]

export const PATHWAY_ORDER = [
  'RESKILL',
  'REDEPLOY',
  'ROLE_REDESIGN',
  'UNCHANGED',
  'ADDITIONAL_INTERVENTION',
  'HIGH_TRANSITION_RISK',
] as const

export const PATHWAY_META: Record<
  (typeof PATHWAY_ORDER)[number],
  { label: string; color: string; tint: string }
> = {
  RESKILL: { label: 'Reskill', color: '#35D6FF', tint: '#102833' },
  REDEPLOY: { label: 'Redeploy', color: '#36E0A0', tint: '#0D2A22' },
  ROLE_REDESIGN: { label: 'Role Redesign', color: '#4F7CFF', tint: '#121A2E' },
  UNCHANGED: { label: 'Unchanged', color: '#7F8B9A', tint: '#161C24' },
  ADDITIONAL_INTERVENTION: { label: 'Additional Intervention', color: '#FFB84D', tint: '#2C2212' },
  HIGH_TRANSITION_RISK: { label: 'High Transition Risk', color: '#FF5C67', tint: '#2C1518' },
}

export const PRODUCT_LOOP = [
  'Decision maker',
  'Joule',
  'Scenario agent',
  'Workforce agent',
  'SAP Build Process Automation',
  'SAP HANA Cloud',
  'Digital workforce',
  'Simulation engine',
  'Counterfactual analysis',
  'Red team / stress test',
  'Joule explanation',
  'SAP Analytics Cloud',
  'Human decision',
]

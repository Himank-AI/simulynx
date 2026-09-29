using simulynx from '../db/schema';

service SimulationService @(path: 'simulation') {
  @readonly entity Runs as projection on simulynx.SimulationRuns;
  @readonly entity Outcomes as projection on simulynx.PersonaOutcomes;
  @readonly entity Impacts as projection on simulynx.DepartmentImpacts;
  @readonly entity Pathways as projection on simulynx.PathwayCounts;
  @readonly entity Risks as projection on simulynx.RiskFactors;
  @readonly entity Metrics as projection on simulynx.SimulationMetrics;
  @readonly entity SkillShifts as projection on simulynx.SkillTransitions;

  action execute(scenarioId: String) returns LargeString;
  function bundle(runId: String) returns LargeString;
  function active() returns LargeString;
}

using simulynx from '../db/schema';

service ScenarioService @(path: 'scenario') {
  @readonly entity Scenarios as projection on simulynx.Scenarios;
  @readonly entity Assumptions as projection on simulynx.ScenarioAssumptions;

  action interpret(prompt: String) returns LargeString;
  action createScenario(
    rawPrompt: String,
    decision: String,
    departmentId: String,
    automationLevel: Decimal(5, 4),
    timeHorizonMonths: Integer,
    reskilling: Boolean,
    redeployment: Boolean,
    roleRedesign: Boolean,
    hiring: Boolean,
    reskillInvestment: Decimal(5, 4),
    trainingCompletion: Decimal(5, 4),
    redeployCapacity: Decimal(5, 4)
  ) returns LargeString;
  action updateScenario(
    scenarioId: String,
    automationLevel: Decimal(5, 4),
    timeHorizonMonths: Integer,
    reskilling: Boolean,
    redeployment: Boolean,
    roleRedesign: Boolean,
    hiring: Boolean,
    reskillInvestment: Decimal(5, 4),
    trainingCompletion: Decimal(5, 4),
    redeployCapacity: Decimal(5, 4)
  ) returns LargeString;
}

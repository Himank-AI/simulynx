using simulynx from '../db/schema';

service CounterfactualService @(path: 'counterfactual') {
  @readonly entity Alternatives as projection on simulynx.CounterfactualScenarios;
  @readonly entity Comparisons as projection on simulynx.ScenarioComparisons;

  action runAlternative(
    runId: String,
    automationPercent: Integer,
    trainingPercent: Integer,
    redeployCapacity: String,
    reskillInvestment: String
  ) returns LargeString;
}

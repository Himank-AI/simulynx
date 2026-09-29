using simulynx from '../db/schema';

service AnalyticsService @(path: 'analytics') {
  @readonly entity Briefs as projection on simulynx.DecisionBriefs;
  @readonly entity Events as projection on simulynx.ProcessEvents;

  function comparison() returns LargeString;
  function decisionBrief(runId: String) returns LargeString;
  function adapters() returns LargeString;
  function stress(runId: String) returns LargeString;
}

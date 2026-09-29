import cds from '@sap/cds'
import { PATHWAY_META, PATHWAY_ORDER } from '../engine/content.ts'
import { analyzeStress } from '../engine/stress.ts'
import { buildDecisionBrief, briefToMarkdown } from '../engine/analyticsService.ts'
import { getDepartment } from '../engine/catalog.ts'
import type { SimulationResult } from '../engine/types.ts'
import { MockAnalyticsCloudService } from '../external/analytics-cloud-service.ts'
import { MockBuildProcessAutomationService } from '../external/build-automation-service.ts'
import { clip } from './values.ts'

const analytics = new MockAnalyticsCloudService()
const workflow = new MockBuildProcessAutomationService()

export async function persistRun(
  result: SimulationResult,
  options: { id: string; committed: boolean; active: boolean; startedAt?: string },
): Promise<void> {
  const completedAt = result.generatedAt
  const startedAt = options.startedAt ?? completedAt
  if (options.active) {
    await cds.run(UPDATE('simulynx.SimulationRuns').set({ active: false }).where({ active: true }))
  }

  await cds.run(DELETE.from('simulynx.DecisionBriefs').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.PersonaOutcomes').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.DepartmentImpacts').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.PathwayCounts').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.SkillTransitions').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.RiskFactors').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.SimulationMetrics').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.CounterfactualScenarios').where({ run_ID: options.id }))
  await cds.run(DELETE.from('simulynx.CounterfactualScenarios').where({ alternativeRun_ID: options.id }))
  await cds.run(DELETE.from('simulynx.SimulationRuns').where({ ID: options.id }))

  await cds.run(
    INSERT.into('simulynx.SimulationRuns').entries({
      ID: options.id,
      scenario_ID: result.scenario.id,
      startedAt,
      completedAt,
      status: 'complete',
      affected: result.affected,
      directScope: result.directScope,
      reskillDemand: result.reskillDemand,
      redeployDemand: result.redeployDemand,
      productivityNearTerm: result.productivityNearTerm,
      productivityHorizon: result.productivityHorizon,
      skillReadiness: result.skillReadiness,
      transitionRisk: result.transitionRisk,
      riskScore: result.riskScore,
      riskDriver: clip(result.riskDriver, 500),
      committed: options.committed,
      active: options.active,
      disclaimer: 'Simulation result — not a prediction.',
    }),
  )

  if (result.personaOutcomes.length) {
    await cds.run(
      INSERT.into('simulynx.PersonaOutcomes').entries(
        result.personaOutcomes.map((outcome) => ({
          run_ID: options.id,
          persona_ID: outcome.personaId,
          scope: outcome.scope,
          pathway: outcome.pathway,
          pathwayLabel: outcome.simulatedPathwayLabel,
          transitionScore: outcome.transitionScore,
          skillGapLabel: clip(outcome.skillGapLabel, 80),
          targetRole_ID: outcome.targetRoleId || null,
          rationale: clip(outcome.rationale, 1000),
        })),
      ),
    )
  }

  if (result.departmentImpact.length) {
    await cds.run(
      INSERT.into('simulynx.DepartmentImpacts').entries(
        result.departmentImpact.map((impact) => ({
          run_ID: options.id,
          impactKey: impact.key,
          name: impact.name,
          kind: impact.kind,
          affected: impact.affected,
          narrative: clip(impact.narrative, 500),
          capacityStrain: impact.capacityStrain,
          netLoad: impact.netLoad,
        })),
      ),
    )
  }

  await cds.run(
    INSERT.into('simulynx.PathwayCounts').entries(
      PATHWAY_ORDER.map((pathway) => ({
        run_ID: options.id,
        pathway,
        label: PATHWAY_META[pathway].label,
        count: result.pathways[pathway],
      })),
    ),
  )

  const shifts = [
    ...result.skillTransition.current.map((skillName, position) => ({
      run_ID: options.id,
      side: 'current',
      position,
      skillName,
    })),
    ...result.skillTransition.future.map((skillName, position) => ({
      run_ID: options.id,
      side: 'future',
      position,
      skillName,
    })),
  ]
  if (shifts.length) await cds.run(INSERT.into('simulynx.SkillTransitions').entries(shifts))

  await cds.run(DELETE.from('simulynx.ScenarioAssumptions').where({ scenario_ID: result.scenario.id }))
  if (result.assumptions.length) {
    await cds.run(
      INSERT.into('simulynx.ScenarioAssumptions').entries(
        result.assumptions.map((assumption) => ({
          scenario_ID: result.scenario.id,
          assumptionId: assumption.id,
          statement: clip(assumption.statement, 400),
          sensitivity: assumption.sensitivity,
          source: assumption.source,
        })),
      ),
    )
  }

  const stress = analyzeStress(result.scenario, result.generatedAt)
  if (stress.length) {
    await cds.run(
      INSERT.into('simulynx.RiskFactors').entries(
        stress.map((item) => ({
          run_ID: options.id,
          factorId: item.id,
          title: clip(item.title, 180),
          assumption: clip(item.assumption, 400),
          severity: item.severity,
          sensitivity: item.sensitivity,
          effect: clip(item.effect, 800),
          affectedDelta: item.affectedDelta,
          highRiskDelta: item.highRiskDelta,
          readinessDelta: item.readinessDelta,
        })),
      ),
    )
  }

  const metrics = [
    ['affected', 'Workforce affected', result.affected, 'personas'],
    ['reskillDemand', 'Reskilling demand', result.reskillDemand, 'pathways'],
    ['redeployDemand', 'Redeployment demand', result.redeployDemand, 'pathways'],
    ['highTransitionRisk', 'High transition risk', result.pathways.HIGH_TRANSITION_RISK, 'pathways'],
    ['skillReadiness', 'Skill readiness', result.skillReadiness, 'score'],
    ['riskScore', 'Transition risk score', result.riskScore, 'score'],
    ['productivityNearTerm', 'Near-term productivity', result.productivityNearTerm, 'points'],
    ['productivityHorizon', 'Horizon productivity', result.productivityHorizon, 'points'],
    ['directScope', 'Direct scope', result.directScope, 'positions'],
  ] as const
  await cds.run(
    INSERT.into('simulynx.SimulationMetrics').entries(
      metrics.map(([metric, label, value, unit]) => ({
        run_ID: options.id,
        metric,
        label,
        value,
        unit,
      })),
    ),
  )

  const story = analytics.story(result)
  const alternatives = ['Baseline', '10% Automation', '20% Automation + Reskilling', '20% Automation + Redeployment']
  const brief = buildDecisionBrief(result, alternatives.filter((name) => name !== result.scenario.name))
  await cds.run(
    INSERT.into('simulynx.DecisionBriefs').entries({
      ID: options.id,
      run_ID: options.id,
      title: brief.title,
      body: briefToMarkdown(brief),
      adapter: story.adapter,
      published: story.published,
      connected: false,
      createdAt: completedAt,
    }),
  )

  await cds.run(UPDATE('simulynx.Scenarios').set({ status: 'complete' }).where({ ID: result.scenario.id }))

  if (options.committed) {
    const department = getDepartment(result.scenario.departmentId).name
    await workflow.record(result.scenario.id, options.id, 'SimulationExecuted', `Simulation executed for ${department}.`)
    await workflow.record(result.scenario.id, options.id, 'ResultsGenerated', 'Persona outcomes, department impacts, and metrics were written to CDS.')
    await workflow.record(result.scenario.id, options.id, 'DecisionBriefCreated', 'A local decision brief was created. It was not published to SAP Analytics Cloud.')
  }
}

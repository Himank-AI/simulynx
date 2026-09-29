# SIMULYNX

**Simulate before you commit.**

Explore workforce decisions before they become real-world consequences.

Simulynx is a digital workforce simulation platform. A connected synthetic workforce lets an organization test a decision across different workforce perspectives before implementation. It is not an HR dashboard, and it does not recommend a decision.

Every result is labeled **Simulation result — not a prediction.**

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | SAPUI5 / Fiori principles + TypeScript |
| Backend | SAP CAP + Node.js + TypeScript |
| Domain | CDS |
| Database | SAP HANA Cloud-ready CDS. Local runtime uses SQLite through CAP. |
| API | OData V4 |
| AI | Joule / SAP AI abstraction (`MockJouleService`) |
| Workflow | SAP Build Process Automation abstraction (`MockBuildProcessAutomationService`) |
| Analytics | SAP Analytics Cloud abstraction (`MockAnalyticsCloudService`) |

Core IP: Digital Workforce, simulation engine, counterfactual analysis, and stress testing.

Live SAP BTP destinations are not configured. Mock adapters are separate from the future service classes and report `connected: false`.

```
SAPUI5  →  OData  →  CAP services  →  CDS  →  SQLite (HANA Cloud-ready)
```

## Run

```bash
npm install
npm start
```

`npm start` compiles the SAPUI5 TypeScript, deploys the CDS model into `db.sqlite` when that file is missing, seeds seven deterministic simulations, and serves the app.

Open [http://localhost:4004](http://localhost:4004). The UI is at `/simulynx/webapp/index.html`.

If port 4004 is already in use:

```bash
npx cds-tsx serve --port 4005
```

Reset local data:

```bash
rm -f db.sqlite && npm run deploy && npm start
```

## Demo enterprise

Synthetic organization **Demo Enterprise**: 24,680 modeled positions, 2,400 digital personas, 45 representative personas across Technology, Customer Support, Sales, Finance, Human Resources, Operations, Product, and Marketing. Personas are not employees.

The committed Customer Support 20% automation scenario evaluates **1,842** personas: Reskill 714, Redeploy 362, Role Redesign 185, Unchanged 262, Additional Intervention 137, High Transition Risk 182. The same scenario always produces the same result.

## Flow

1. Scenario Studio interprets a decision and `ScenarioService` stores it.
2. Run Simulation calls `SimulationService`. The browser does not calculate pathways.
3. The engine writes a `SimulationRun`, persona outcomes, department impacts, skill transitions, risk factors, metrics, and a decision brief.
4. Digital Earth reads that run over OData and plays the analysis sequence.
5. Scenario Comparison calls `CounterfactualService` when assumptions change.

## Services

- `WorkforceService` — `/odata/v4/workforce`
- `ScenarioService` — `/odata/v4/scenario`
- `SimulationService` — `/odata/v4/simulation`
- `CounterfactualService` — `/odata/v4/counterfactual`
- `AnalyticsService` — `/odata/v4/analytics`
- `JouleService` — `/odata/v4/joule`

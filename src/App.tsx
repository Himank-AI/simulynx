import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/shell.tsx'
import { DecisionBrief } from './pages/brief.tsx'
import { ScenarioComparison } from './pages/compare.tsx'
import { HistoryPage } from './pages/history.tsx'
import { ExecutiveHome } from './pages/home.tsx'
import { Personas } from './pages/personas.tsx'
import { SimulationResults } from './pages/results.tsx'
import { Settings } from './pages/settings.tsx'
import { SkillsMobility } from './pages/skills.tsx'
import { StressTest } from './pages/stress.tsx'
import { ScenarioStudio } from './pages/studio.tsx'
import { WhatIf } from './pages/what-if.tsx'
import { DigitalWorkforce } from './pages/workforce.tsx'
import { StoreProvider } from './state/store.tsx'
import { Link } from 'react-router-dom'

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Navigate to="/studio" replace />} />
            <Route path="overview" element={<ExecutiveHome />} />
            <Route path="workforce" element={<DigitalWorkforce />} />
            <Route path="personas" element={<Personas />} />
            <Route path="studio" element={<ScenarioStudio />} />
            <Route path="simulations" element={<SimulationResults />} />
            <Route path="compare" element={<ScenarioComparison />} />
            <Route path="what-if" element={<WhatIf />} />
            <Route path="skills" element={<SkillsMobility />} />
            <Route path="stress" element={<StressTest />} />
            <Route path="brief" element={<DecisionBrief />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Missing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}

function Missing() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
      <h1 className="text-lg font-semibold text-ink-950">This screen is not in Simulynx.</h1>
      <Link to="/overview" className="mt-3 inline-block text-sm text-brand-700">
        Back to overview
      </Link>
    </div>
  )
}

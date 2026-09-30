import { DigitalEarth } from '../components/digital-earth.tsx'
import { Button } from '../components/ui.tsx'
import { runSimulation } from '../services/simulation/simulationEngine.ts'
import { getDepartment } from '../services/workforce/workforceService.ts'
import { useStore } from '../state/store.tsx'

export function ExecutiveHome() {
  const store = useStore()
  const built = store.studio.built
  const department = built ? getDepartment(built.departmentId).name : null

  function checkSimulation() {
    if (!built || store.vizStartedAt) return
    store.launchSimulation(built, runSimulation(built))
  }

  return (
    <div className="enter relative h-full">
      <DigitalEarth />
      <div className="absolute bottom-16 right-4 z-20 flex max-w-sm flex-col items-end gap-2">
        {built ? (
          <div className="glass rounded-2xl px-3 py-2 text-right text-xs leading-5 text-ink-600">
            <div className="font-medium text-ink-950">{built.rawPrompt || built.name}</div>
            <div>{department}</div>
            <div>{built.timeHorizonMonths} months</div>
          </div>
        ) : null}
        <Button disabled={!built || Boolean(store.vizStartedAt)} onClick={checkSimulation}>
          Check Simulation
        </Button>
      </div>
    </div>
  )
}

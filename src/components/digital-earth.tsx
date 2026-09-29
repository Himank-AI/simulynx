import { Minus, Plus, RotateCcw, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PATHWAY_META } from '../content.ts'
import { formatNumber, relativeTime } from '../lib/format.ts'
import { cn } from '../lib/cn.ts'
import { useStore } from '../state/store.tsx'
import { getOrganization, getPersona, getRole, listDepartments, listRoles, listSkills } from '../services/workforce/workforceService.ts'
import { COHORT_COLOR, COHORT_ORDER, buildField, cohortName, type FieldLink, type FieldNode } from '../viz/field.ts'
import { readViz, type VizReadout } from '../viz/phase.ts'

interface Filters {
  query: string
  departmentId: string
  roleId: string
  skillId: string
  location: string
  impact: '' | 'low' | 'medium' | 'high'
  risk: '' | 'low' | 'medium' | 'high'
}

const EMPTY: Filters = { query: '', departmentId: '', roleId: '', skillId: '', location: '', impact: '', risk: '' }

interface ScreenPoint {
  key: string
  sx: number
  sy: number
  r: number
  node: FieldNode
}

export function DigitalEarth() {
  const store = useStore()
  const visual = store.vizPending?.result ?? store.result
  const org = getOrganization()
  const field = useMemo(() => buildField(visual.scenario, visual.personaOutcomes), [visual])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const positions = useRef<ScreenPoint[]>([])
  const camera = useRef({ zoom: 1, panX: 0, panY: 0 })
  const pointer = useRef({ x: 0, y: 0, inside: false, nx: 0, ny: 0 })
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [lockedFocus, setLockedFocus] = useState<string | null>(null)
  const [hoveredCohort, setHoveredCohort] = useState<string | null>(null)
  const focusId = hoveredCohort ?? lockedFocus
  const live = useRef({ startedAt: null as number | null, personaId: null as string | null })
  const [openPill, setOpenPill] = useState<string | null>(null)
  const [showLinks, setShowLinks] = useState(true)
  const [showCohorts, setShowCohorts] = useState(true)
  const [hover, setHover] = useState<ScreenPoint | null>(null)
  const [readout, setReadout] = useState<VizReadout>(() => readViz(store.vizStartedAt, Date.now()))
  const reduce = useRef(false)

  camera.current = { zoom, panX: pan.x, panY: pan.y }
  live.current = { startedAt: store.vizStartedAt, personaId: store.personaId }

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setReadout(readViz(store.vizStartedAt, Date.now())), 180)
    return () => window.clearInterval(timer)
  }, [store.vizStartedAt])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0
    const paint = (now: number) => {
      frame = requestAnimationFrame(paint)
      const rect = wrap.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio)
        canvas.height = Math.floor(height * ratio)
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      drawScene(context, width, height, now)
    }
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [field, filters, focusId, showLinks, showCohorts, hover?.key, visual.scenario.departmentId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((current) => clamp(current * (event.deltaY > 0 ? 0.92 : 1.08), 0.65, 2.3))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  function drawScene(context: CanvasRenderingContext2D, width: number, height: number, now: number) {
    const phase = readViz(live.current.startedAt, now)
    const cam = camera.current
    const coreX = width / 2 + cam.panX
    const coreY = height / 2 + cam.panY
    const fit = Math.min(width, height) / 980
    const scale = fit * cam.zoom
    const parallaxX = pointer.current.nx * 10
    const parallaxY = pointer.current.ny * 7
    const energy = reduce.current ? 0.2 : phase.energy
    const time = reduce.current ? 0 : now / 1000

    context.clearRect(0, 0, width, height)
    context.fillStyle = '#05070A'
    context.fillRect(0, 0, width, height)

    const wash = context.createRadialGradient(coreX, coreY, 40, coreX, coreY, Math.max(width, height) * 0.55)
    wash.addColorStop(0, `rgba(53, 214, 255, ${0.05 + energy * 0.05})`)
    wash.addColorStop(0.45, 'rgba(79, 124, 255, 0.03)')
    wash.addColorStop(1, 'rgba(5, 7, 10, 0)')
    context.fillStyle = wash
    context.fillRect(0, 0, width, height)

    drawGrid(context, width, height, coreX + parallaxX * 1.4, coreY + parallaxY * 1.4, scale)
    drawAmbient(context, width, height, time)

    if (showCohorts) drawOrbits(context, coreX, coreY, scale, time, energy)

    const points: ScreenPoint[] = []
    const byKey = new Map<string, ScreenPoint>()
    for (const node of field.nodes) {
      if (!passes(node, filters)) continue
      const wobble = reduce.current ? 0 : Math.sin(time * 0.55 + node.phase) * (node.kind === 'persona' ? 3.2 : 1.6)
      const screen = {
        sx: coreX + node.x * scale + parallaxX * 0.35,
        sy: coreY + node.y * scale + parallaxY * 0.35 + wobble,
      }
      const radius = (node.kind === 'persona' ? 2.4 + node.impact * 3.1 : 1.15 + node.impact) * Math.max(0.85, Math.min(1.35, cam.zoom))
      const point = { key: node.key, sx: screen.sx, sy: screen.sy, r: radius, node }
      points.push(point)
      byKey.set(node.key, point)
    }
    positions.current = points

    if (showLinks) drawLinks(context, field.links, byKey, coreX, coreY, time, phase, live.current.personaId, hover?.key ?? null)

    const activeUntil = phase.id === 'idle' || phase.id === 'analyzing' ? field.nodes.length : Math.floor(phase.progress * field.nodes.filter((node) => node.active).length)
    let activeSeen = 0
    for (const point of points) {
      const dim = Boolean(focusId && point.node.departmentId !== focusId)
      const lit = point.node.active && activeSeen < activeUntil
      if (point.node.active) activeSeen += 1
      drawNode(context, point, time, dim, lit, phase, live.current.personaId === point.node.personaId, hover?.key === point.key)
    }

    drawCore(context, coreX, coreY, time, energy, phase)
    drawFog(context, width, height, coreX, coreY)
    if (pointer.current.inside) drawCursor(context, pointer.current.x, pointer.current.y)

    if (labelRef.current) {
      labelRef.current.style.left = `${coreX}px`
      labelRef.current.style.top = `${coreY}px`
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    pointer.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      inside: true,
      nx: (event.clientX - rect.left) / rect.width - 0.5,
      ny: (event.clientY - rect.top) / rect.height - 0.5,
    }
    if (drag.current) {
      const dx = event.clientX - drag.current.x
      const dy = event.clientY - drag.current.y
      if (Math.hypot(dx, dy) > 4) drag.current.moved = true
      setPan({ x: drag.current.panX + dx, y: drag.current.panY + dy })
      return
    }
    const hit = hitTest(pointer.current.x, pointer.current.y)
    setHover((current) => (current?.key === hit?.key ? current : hit))
  }

  function hitTest(x: number, y: number): ScreenPoint | null {
    let best: ScreenPoint | null = null
    let bestDistance = 18
    for (const point of positions.current) {
      const distance = Math.hypot(point.sx - x, point.sy - y)
      if (distance < point.r + 8 && distance < bestDistance) {
        best = point
        bestDistance = distance
      }
    }
    return best
  }

  const locations = useMemo(() => [...new Set(field.nodes.filter((node) => node.location).map((node) => node.location))].sort(), [field.nodes])
  const running = readout.id !== 'idle' && readout.id !== 'complete'
  const highRisk = visual.pathways.HIGH_TRANSITION_RISK

  return (
    <div ref={wrapRef} className="relative h-full min-h-[640px] overflow-hidden bg-canvas">
      <h1 className="sr-only">Digital Workforce Intelligence</h1>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Digital workforce. Synthetic personas orbit the workforce core. Use search or the persona explorer for keyboard access."
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          pointer.current.inside = false
          setHover(null)
        }}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y, moved: false }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerUp={(event) => {
          const moved = drag.current?.moved
          drag.current = null
          if (moved) return
          const rect = event.currentTarget.getBoundingClientRect()
          const hit = hitTest(event.clientX - rect.left, event.clientY - rect.top)
          if (!hit) return
          if (hit.node.personaId) store.openPersona(hit.node.personaId)
          else setLockedFocus((current) => (current === hit.node.departmentId ? null : hit.node.departmentId))
        }}
      />

      <div ref={labelRef} className="pointer-events-none absolute w-44 -translate-x-1/2 -translate-y-1/2 text-center">
        <svg viewBox="0 0 120 120" className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(53,214,255,0.16)" strokeWidth="1" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#35D6FF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray={`${326 * readout.progress} 326`}
            transform="rotate(-90 60 60)"
            opacity={running || readout.id === 'complete' ? 0.9 : 0.35}
          />
        </svg>
        <div className="text-[10px] font-medium tracking-[0.22em] text-brand-500">DIGITAL WORKFORCE</div>
        <div className="mt-1 font-mono text-4xl font-medium tracking-tight text-ink-950">{formatNumber(org.digitalPersonas)}</div>
        <div className="text-[10px] tracking-[0.18em] text-ink-500">PERSONAS</div>
        <div className="mt-3 text-[11px] text-ink-600">{running ? readout.label : `${formatNumber(visual.affected)} affected`}</div>
        <div className="text-[11px] text-ink-500">{running ? visual.scenario.name : `${formatNumber(highRisk)} high transition risk`}</div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-xl">
          <label className="glass flex h-10 items-center gap-2 rounded-full px-3">
            <Search className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            <input
              id="earth-search"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search personas..."
              aria-label="Search personas"
              className="w-full bg-transparent text-sm text-ink-950 outline-none placeholder:text-ink-400"
            />
          </label>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <Pill label="Cohort" active={Boolean(lockedFocus)} open={openPill === 'cohort'} onClick={() => setOpenPill(openPill === 'cohort' ? null : 'cohort')}>
              {COHORT_ORDER.map((id) => (
                <Option key={id} onClick={() => { setLockedFocus(lockedFocus === id ? null : id); setOpenPill(null) }}>{cohortName(id)}</Option>
              ))}
            </Pill>
            <SelectPill label="Role" value={filters.roleId} open={openPill === 'role'} onOpen={() => setOpenPill(openPill === 'role' ? null : 'role')} onClear={() => setFilters({ ...filters, roleId: '' })}>
              {listRoles().filter((role) => role.staffed).map((role) => (
                <Option key={role.id} onClick={() => { setFilters({ ...filters, roleId: role.id }); setOpenPill(null) }}>{role.name}</Option>
              ))}
            </SelectPill>
            <SelectPill label="Department" value={filters.departmentId} open={openPill === 'department'} onOpen={() => setOpenPill(openPill === 'department' ? null : 'department')} onClear={() => setFilters({ ...filters, departmentId: '' })}>
              {listDepartments().map((department) => (
                <Option key={department.id} onClick={() => { setFilters({ ...filters, departmentId: department.id }); setOpenPill(null) }}>{department.name}</Option>
              ))}
            </SelectPill>
            <SelectPill label="Skill" value={filters.skillId} open={openPill === 'skill'} onOpen={() => setOpenPill(openPill === 'skill' ? null : 'skill')} onClear={() => setFilters({ ...filters, skillId: '' })}>
              {listSkills().map((skill) => (
                <Option key={skill.id} onClick={() => { setFilters({ ...filters, skillId: skill.id }); setOpenPill(null) }}>{skill.name}</Option>
              ))}
            </SelectPill>
            <SelectPill label="Location" value={filters.location} open={openPill === 'location'} onOpen={() => setOpenPill(openPill === 'location' ? null : 'location')} onClear={() => setFilters({ ...filters, location: '' })}>
              {locations.map((location) => (
                <Option key={location} onClick={() => { setFilters({ ...filters, location }); setOpenPill(null) }}>{location}</Option>
              ))}
            </SelectPill>
            <SelectPill label="Impact" value={filters.impact} open={openPill === 'impact'} onOpen={() => setOpenPill(openPill === 'impact' ? null : 'impact')} onClear={() => setFilters({ ...filters, impact: '' })}>
              {(['low', 'medium', 'high'] as const).map((value) => (
                <Option key={value} onClick={() => { setFilters({ ...filters, impact: value }); setOpenPill(null) }}>{value}</Option>
              ))}
            </SelectPill>
            <SelectPill label="Risk" value={filters.risk} open={openPill === 'risk'} onOpen={() => setOpenPill(openPill === 'risk' ? null : 'risk')} onClear={() => setFilters({ ...filters, risk: '' })}>
              {(['low', 'medium', 'high'] as const).map((value) => (
                <Option key={value} onClick={() => { setFilters({ ...filters, risk: value }); setOpenPill(null) }}>{value}</Option>
              ))}
            </SelectPill>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-16 z-10 flex flex-col gap-2">
        <Control label="Zoom in" onClick={() => setZoom((current) => clamp(current * 1.12, 0.65, 2.3))}><Plus className="h-4 w-4" /></Control>
        <Control label="Zoom out" onClick={() => setZoom((current) => clamp(current / 1.12, 0.65, 2.3))}><Minus className="h-4 w-4" /></Control>
        <Control label="Recenter" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}><span className="text-sm">⌖</span></Control>
        <Control label="Reset view and filters" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setFilters(EMPTY); setLockedFocus(null) }}><RotateCcw className="h-3.5 w-3.5" /></Control>
        <Control label="Connections" pressed={showLinks} onClick={() => setShowLinks((current) => !current)}><span className="text-[10px] tracking-wide">Links</span></Control>
        <Control label="Cohorts" pressed={showCohorts} onClick={() => setShowCohorts((current) => !current)}><span className="text-[10px] tracking-wide">Orbits</span></Control>
      </div>

      <aside className="glass absolute bottom-24 left-4 z-10 w-52 rounded-2xl px-3 py-3">
        <div className="text-[10px] font-medium tracking-[0.16em] text-ink-400">WORKFORCE COHORTS</div>
        <ul className="mt-2 space-y-1">
          {COHORT_ORDER.map((id) => (
            <li key={id}>
              <button
                type="button"
                className={cn('flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-ink-700 hover:bg-white/5', focusId === id && 'text-ink-950')}
                onClick={() => setLockedFocus((current) => (current === id ? null : id))}
                onMouseEnter={() => setHoveredCohort(id)}
                onMouseLeave={() => setHoveredCohort((current) => (current === id ? null : current))}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: COHORT_COLOR[id], boxShadow: `0 0 8px ${COHORT_COLOR[id]}` }} />
                {cohortName(id)}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] leading-4 text-ink-400">Model {formatNumber(org.workforce)} positions. Nodes are synthetic.</p>
      </aside>

      <div className="glass absolute inset-x-4 bottom-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-2.5 text-[11px] text-ink-500 sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
        <span className="inline-flex items-center gap-2 text-ink-800">
          <span className={cn('h-1.5 w-1.5 rounded-full', running ? 'bg-brand-500' : 'bg-good-700')} />
          {readout.label}
        </span>
        <span className="font-mono text-ink-700">{formatNumber(org.digitalPersonas)} personas</span>
        <span className="font-mono text-ink-700">{formatNumber(visual.affected)} evaluated</span>
        <span className="font-mono text-ink-700">{formatNumber(highRisk)} high transition risk</span>
        <span>Last simulation {relativeTime(visual.generatedAt)}</span>
        <span className="text-ink-400">Synthetic data · not a prediction · mock SAP adapters</span>
        <Link to="/simulations" className="text-brand-700">Results</Link>
        <Link to="/compare" className="text-brand-700">Compare</Link>
        <Link to="/studio" className="text-brand-700">Studio</Link>
      </div>

      {hover ? <Tooltip point={hover} /> : null}
    </div>
  )
}

function passes(node: FieldNode, filters: Filters): boolean {
  if ((filters.query || filters.roleId || filters.skillId || filters.location) && node.kind === 'density') return false
  if (filters.departmentId && node.departmentId !== filters.departmentId) return false
  if (filters.roleId && node.roleId !== filters.roleId) return false
  if (filters.location && node.location !== filters.location) return false
  if (filters.skillId && !node.skillIds.includes(filters.skillId)) return false
  if (filters.impact && impactBand(node.impact) !== filters.impact) return false
  if (filters.risk && node.risk !== filters.risk) return false
  if (filters.query) {
    const haystack = `${node.label} ${node.detail} ${node.location}`.toLowerCase()
    if (!haystack.includes(filters.query.trim().toLowerCase())) return false
  }
  return true
}

function impactBand(impact: number): Filters['impact'] {
  if (impact >= 0.8) return 'high'
  if (impact >= 0.5) return 'medium'
  return 'low'
}

function Tooltip({ point }: { point: ScreenPoint }) {
  const persona = point.node.personaId ? getPersona(point.node.personaId) : undefined
  const role = persona ? getRole(persona.roleId)?.name : null
  const pathway = point.node.pathway ? PATHWAY_META[point.node.pathway].label : null
  return (
    <div className="glass pointer-events-none absolute z-20 w-56 rounded-xl px-3 py-2" style={{ left: point.sx + 14, top: point.sy + 14 }}>
      <div className="text-sm font-medium text-ink-950">{point.node.kind === 'persona' ? point.node.label : point.node.label}</div>
      <div className="text-[11px] leading-4 text-ink-500">{point.node.kind === 'persona' ? `${role} · ${persona?.location}` : point.node.detail}</div>
      {pathway ? <div className="mt-1 text-[11px] text-brand-700">Simulated pathway · {pathway}</div> : null}
    </div>
  )
}

function Control({ children, label, onClick, pressed }: { children: ReactNode; label: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(
        'glass flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:text-brand-500',
        pressed && 'text-brand-500 shadow-[0_0_16px_rgba(53,214,255,0.28)]',
      )}
    >
      {children}
    </button>
  )
}

function Pill({ label, active, open, onClick, children }: { label: string; active: boolean; open: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <div className="relative">
      <button type="button" onClick={onClick} className={cn('glass h-7 rounded-full px-2.5 text-[10px] tracking-[0.12em] text-ink-500', (active || open) && 'text-brand-500 shadow-[0_0_16px_rgba(53,214,255,0.25)]')}>
        {label}
      </button>
      {open ? <div className="glass absolute left-0 top-8 z-20 max-h-56 w-52 overflow-auto rounded-xl p-1">{children}</div> : null}
    </div>
  )
}

function SelectPill({ label, value, open, onOpen, onClear, children }: { label: string; value: string; open: boolean; onOpen: () => void; onClear: () => void; children: ReactNode }) {
  return (
    <div className="relative">
      <button type="button" onClick={value ? onClear : onOpen} className={cn('glass h-7 rounded-full px-2.5 text-[10px] tracking-[0.12em] text-ink-500', (value || open) && 'text-brand-500 shadow-[0_0_16px_rgba(53,214,255,0.25)]')}>
        {value ? `${label} ×` : label}
      </button>
      {open ? <div className="glass absolute left-0 top-8 z-20 max-h-56 w-56 overflow-auto rounded-xl p-1">{children}</div> : null}
    </div>
  )
}

function Option({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-ink-700 hover:bg-white/5 hover:text-ink-950">
      {children}
    </button>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number, originX: number, originY: number, scale: number) {
  const step = 64 * Math.max(0.7, scale)
  context.save()
  context.translate(originX, originY)
  context.strokeStyle = 'rgba(79, 124, 255, 0.09)'
  context.lineWidth = 1
  const reach = Math.max(width, height)
  for (let x = -reach; x <= reach; x += step) {
    context.beginPath()
    context.moveTo(x, -reach)
    context.lineTo(x, reach)
    context.stroke()
  }
  for (let y = -reach; y <= reach; y += step) {
    context.beginPath()
    context.moveTo(-reach, y)
    context.lineTo(reach, y)
    context.stroke()
  }
  context.restore()
}

function drawAmbient(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  for (let index = 0; index < 36; index += 1) {
    const seed = index * 97.13
    const x = ((seed * 13 + time * (2 + (index % 5))) % width + width) % width
    const y = ((seed * 29 + time * 1.4) % height + height) % height
    context.fillStyle = `rgba(245, 247, 250, ${0.04 + (index % 4) * 0.015})`
    context.beginPath()
    context.arc(x, y, index % 6 === 0 ? 1.4 : 0.7, 0, Math.PI * 2)
    context.fill()
  }
}

function drawOrbits(context: CanvasRenderingContext2D, coreX: number, coreY: number, scale: number, time: number, energy: number) {
  context.save()
  context.translate(coreX, coreY)
  for (const radius of [150, 248, 352]) {
    context.beginPath()
    context.strokeStyle = `rgba(53, 214, 255, ${0.05 + energy * 0.04})`
    context.lineWidth = 1
    context.arc(0, 0, radius * scale, time * 0.02, Math.PI * 2 + time * 0.02)
    context.stroke()
  }
  context.restore()
}

function drawLinks(
  context: CanvasRenderingContext2D,
  links: FieldLink[],
  byKey: Map<string, ScreenPoint>,
  coreX: number,
  coreY: number,
  time: number,
  phase: VizReadout,
  selectedId: string | null,
  hoverKey: string | null,
) {
  for (const link of links) {
    const from = byKey.get(link.from)
    if (!from || from.node.kind !== 'persona') continue
    const to = link.to === 'core' ? null : byKey.get(link.to)
    if (link.to !== 'core' && !to) continue
    const emphasized = from.node.personaId === selectedId || from.key === hoverKey || to?.node.personaId === selectedId || to?.key === hoverKey
    const simulating = phase.id !== 'idle' && from.node.active && (phase.id === 'mapping' || phase.id === 'simulating' || phase.id === 'stress' || phase.id === 'complete')
    if (link.to !== 'core' && !emphasized) continue
    const x2 = to ? to.sx : coreX
    const y2 = to ? to.sy : coreY
    context.beginPath()
    context.moveTo(from.sx, from.sy)
    context.lineTo(x2, y2)
    context.strokeStyle = emphasized || simulating ? 'rgba(53, 214, 255, 0.8)' : 'rgba(80, 150, 190, 0.15)'
    context.lineWidth = emphasized ? 1.1 : 0.6
    context.stroke()
    if ((emphasized || (simulating && from.node.order % 5 === Math.floor(time) % 5)) && link.to === 'core') {
      const travel = (time * 0.18 + from.node.phase) % 1
      context.fillStyle = '#35D6FF'
      context.beginPath()
      context.arc(from.sx + (x2 - from.sx) * travel, from.sy + (y2 - from.sy) * travel, 1.6, 0, Math.PI * 2)
      context.fill()
    }
  }
}

function drawNode(
  context: CanvasRenderingContext2D,
  point: ScreenPoint,
  time: number,
  dim: boolean,
  lit: boolean,
  phase: VizReadout,
  selected: boolean,
  hovered: boolean,
) {
  const color = point.node.risk === 'high' ? '#FF5C67' : point.node.risk === 'medium' ? '#FFB84D' : COHORT_COLOR[point.node.departmentId] ?? '#35D6FF'
  const scale = hovered ? 1.15 : selected ? 1.08 : 1
  const radius = point.r * scale
  const pulse = point.node.risk === 'high' ? 0.55 + Math.sin(time * 4.2 + point.node.phase) * 0.45 : point.node.risk === 'medium' ? 0.75 + Math.sin(time * 1.6 + point.node.phase) * 0.25 : 1
  const waveHit = phase.wave > 0 && Math.abs(Math.hypot(point.node.x, point.node.y) / 430 - phase.wave) < 0.08
  context.save()
  context.globalAlpha = dim ? 0.14 : 0.95
  context.beginPath()
  context.strokeStyle = color
  context.globalAlpha = dim ? 0.1 : 0.35 * pulse
  context.lineWidth = 1
  context.arc(point.sx, point.sy, radius + 3.5, 0, Math.PI * 2)
  context.stroke()
  context.globalAlpha = dim ? 0.16 : waveHit || lit || hovered || selected ? 1 : 0.82
  context.fillStyle = color
  context.beginPath()
  context.arc(point.sx, point.sy, radius, 0, Math.PI * 2)
  context.fill()
  if (selected || hovered) {
    context.strokeStyle = '#F5F7FA'
    context.globalAlpha = 0.8
    context.lineWidth = 1
    context.beginPath()
    context.arc(point.sx, point.sy, radius + 6, time, time + 1.4)
    context.stroke()
  }
  context.restore()
}

function drawCore(context: CanvasRenderingContext2D, x: number, y: number, time: number, energy: number, phase: VizReadout) {
  const breath = 1 + Math.sin(time * 1.3) * 0.025 * (0.6 + energy)
  context.save()
  context.translate(x, y)
  context.scale(breath, breath)
  const glow = context.createRadialGradient(0, 0, 10, 0, 0, 120 + energy * 30)
  glow.addColorStop(0, `rgba(53, 214, 255, ${0.22 + energy * 0.18})`)
  glow.addColorStop(0.45, 'rgba(79, 124, 255, 0.08)')
  glow.addColorStop(1, 'rgba(53, 214, 255, 0)')
  context.fillStyle = glow
  context.beginPath()
  context.arc(0, 0, 130, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = `rgba(53, 214, 255, ${0.25 + energy * 0.35})`
  context.lineWidth = 1
  context.beginPath()
  context.arc(0, 0, 78, time * (0.25 + energy), Math.PI * 1.65 + time)
  context.stroke()
  context.beginPath()
  context.strokeStyle = 'rgba(79, 124, 255, 0.45)'
  context.arc(0, 0, 64, -time * (0.18 + energy * 0.4), Math.PI * 1.2 - time)
  context.stroke()
  const body = context.createRadialGradient(-8, -10, 4, 0, 0, 46)
  body.addColorStop(0, '#E9FBFF')
  body.addColorStop(0.35, '#35D6FF')
  body.addColorStop(1, '#0B2230')
  context.fillStyle = body
  context.beginPath()
  context.arc(0, 0, 34, 0, Math.PI * 2)
  context.fill()
  for (let index = 0; index < 5; index += 1) {
    const angle = time * (0.4 + energy * 0.5) + index * 1.25
    const orbit = 92 + (index % 2) * 10
    context.fillStyle = index % 2 ? '#8BE7FF' : '#4F7CFF'
    context.globalAlpha = 0.75
    context.beginPath()
    context.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, 1.7, 0, Math.PI * 2)
    context.fill()
  }
  if (phase.wave > 0) {
    context.globalAlpha = 0.35 * (1 - phase.wave)
    context.strokeStyle = '#35D6FF'
    context.lineWidth = 1.5
    context.beginPath()
    context.arc(0, 0, 70 + phase.wave * 360, 0, Math.PI * 2)
    context.stroke()
  }
  context.restore()
}

function drawFog(context: CanvasRenderingContext2D, width: number, height: number, coreX: number, coreY: number) {
  const fog = context.createRadialGradient(coreX, coreY, Math.min(width, height) * 0.28, coreX, coreY, Math.max(width, height) * 0.72)
  fog.addColorStop(0, 'rgba(5, 7, 10, 0)')
  fog.addColorStop(1, 'rgba(5, 7, 10, 0.55)')
  context.fillStyle = fog
  context.fillRect(0, 0, width, height)
}

function drawCursor(context: CanvasRenderingContext2D, x: number, y: number) {
  const glow = context.createRadialGradient(x, y, 0, x, y, 70)
  glow.addColorStop(0, 'rgba(53, 214, 255, 0.1)')
  glow.addColorStop(1, 'rgba(53, 214, 255, 0)')
  context.fillStyle = glow
  context.beginPath()
  context.arc(x, y, 70, 0, Math.PI * 2)
  context.fill()
}

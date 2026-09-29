interface PersonaNode {
  key: string
  kind: 'persona' | 'density'
  personaId?: string
  departmentId: string
  roleId: string
  label: string
  detail: string
  x: number
  y: number
  phase: number
  impact: number
  risk: 'low' | 'medium' | 'high'
  order: number
  location: string
  skillIds: string[]
  pathway?: string
  active: boolean
}

interface FieldLink {
  from: string
  to: string
}

interface Filters {
  query: string
  departmentId: string
  roleId: string
  skillId: string
  location: string
  impact: string
  risk: string
}

interface Phase {
  id: string
  label: string
  energy: number
  progress: number
  wave: number
}

const COHORT_COLOR: Record<string, string> = {
  'dep-cs': '#35D6FF',
  'dep-tech': '#4F7CFF',
  'dep-fin': '#9AA8B8',
  'dep-hr': '#36E0A0',
  'dep-ops': '#7EB6FF',
  'dep-product': '#8BE7FF',
  'dep-sales': '#FFB84D',
  'dep-mkt': '#8AA4C8',
}

const COHORT_ORDER = ['dep-cs', 'dep-tech', 'dep-fin', 'dep-hr', 'dep-ops', 'dep-product', 'dep-sales', 'dep-mkt']

function hash(seed: string): number {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) value = Math.imul(value ^ seed.charCodeAt(index), 16777619)
  return (value >>> 0) / 4294967296
}

function place(departmentId: string, seed: string, radius: number): { x: number; y: number } {
  const index = Math.max(0, COHORT_ORDER.indexOf(departmentId))
  const sector = (Math.PI * 2) / COHORT_ORDER.length
  const center = -Math.PI / 2 + index * sector
  const angle = center + (hash(seed) - 0.5) * sector * 0.78
  const distance = radius + (hash(`${seed}:r`) - 0.5) * 42
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

function impactOf(pathway?: string): number {
  if (pathway === 'HIGH_TRANSITION_RISK' || pathway === 'ADDITIONAL_INTERVENTION') return 0.92
  if (pathway === 'RESKILL' || pathway === 'REDEPLOY') return 0.7
  if (pathway === 'ROLE_REDESIGN') return 0.55
  if (pathway === 'UNCHANGED') return 0.32
  return 0.36
}

function riskOf(pathway?: string): PersonaNode['risk'] {
  if (pathway === 'HIGH_TRANSITION_RISK') return 'high'
  if (pathway === 'ADDITIONAL_INTERVENTION') return 'medium'
  return 'low'
}

function readViz(startedAt: number | null, now: number): Phase {
  if (startedAt == null) return { id: 'idle', label: 'SIMULATION COMPLETE', energy: 0.34, progress: 1, wave: 0 }
  const elapsed = now - startedAt
  const progress = Math.max(0, Math.min(1, elapsed / 5200))
  if (elapsed < 800) return { id: 'analyzing', label: 'ANALYZING DECISION', energy: 0.74, progress, wave: 0 }
  if (elapsed < 1600) return { id: 'identifying', label: 'IDENTIFYING WORKFORCE', energy: 0.88, progress, wave: 0 }
  if (elapsed < 2500) return { id: 'simulating', label: 'SIMULATING PERSONAS', energy: 1, progress, wave: 0 }
  if (elapsed < 3400) return { id: 'mapping', label: 'MAPPING SKILLS', energy: 1, progress, wave: 0 }
  if (elapsed < 4300) return { id: 'alternatives', label: 'TESTING ALTERNATIVES', energy: 0.96, progress, wave: 0 }
  if (elapsed < 5200) return { id: 'stress', label: 'STRESS TESTING', energy: 0.95, progress, wave: 0 }
  if (elapsed < 6400) return { id: 'complete', label: 'SIMULATION COMPLETE', energy: 0.48, progress: 1, wave: (elapsed - 5200) / 1200 }
  return { id: 'idle', label: 'SIMULATION COMPLETE', energy: 0.34, progress: 1, wave: 0 }
}

interface ScreenPoint {
  key: string
  sx: number
  sy: number
  r: number
  node: PersonaNode
}

function passes(node: PersonaNode, filters: Filters): boolean {
  if ((filters.query || filters.roleId || filters.skillId || filters.location) && node.kind === 'density') return false
  if (filters.departmentId && node.departmentId !== filters.departmentId) return false
  if (filters.roleId && node.roleId !== filters.roleId) return false
  if (filters.location && node.location !== filters.location) return false
  if (filters.skillId && !node.skillIds.includes(filters.skillId)) return false
  if (filters.impact) {
    const band = node.impact >= 0.8 ? 'high' : node.impact >= 0.5 ? 'medium' : 'low'
    if (band !== filters.impact) return false
  }
  if (filters.risk && node.risk !== filters.risk) return false
  if (filters.query) {
    const haystack = `${node.label} ${node.detail} ${node.location}`.toLowerCase()
    if (!haystack.includes(filters.query.trim().toLowerCase())) return false
  }
  return true
}

sap.ui.define([], function () {
  function buildField(personas: Array<Record<string, unknown>>, departments: Array<Record<string, unknown>>, outcomes: Array<Record<string, unknown>>, scenarioDepartment: string) {
    const outcomeById = new Map(outcomes.map((outcome) => [String(outcome.personaId), outcome]))
    const nodes: PersonaNode[] = personas.map((persona, index) => {
      const id = String(persona.ID ?? persona.personaCode)
      const outcome = outcomeById.get(id)
      const departmentId = String(persona.department_ID ?? (persona.department as { ID?: string } | undefined)?.ID ?? '')
      const role = persona.role as { name?: string; ID?: string } | undefined
      const roleId = String(persona.role_ID ?? role?.ID ?? '')
      const stage = String(persona.careerStage_code ?? '')
      const roleName = role?.name ?? 'Role'
      const radius = stage === 'Lead' || stage === 'Senior' || /manager/i.test(roleName) ? 150 : stage === 'Established' ? 248 : 352
      const point = place(departmentId, id, radius)
      const pathway = outcome ? String(outcome.pathway) : undefined
      const active = Boolean(outcome && (outcome.scope === 'origin' || pathway !== 'UNCHANGED'))
      const skills = ((persona.skills as Array<Record<string, unknown>> | undefined) ?? [])
        .map((row) => String((row.skill as { ID?: string } | undefined)?.ID ?? row.skill_ID ?? ''))
        .filter(Boolean)
      const gaps = ((persona.gaps as Array<Record<string, unknown>> | undefined) ?? [])
        .map((row) => String((row.skill as { ID?: string } | undefined)?.ID ?? row.skill_ID ?? ''))
      const departmentName = (persona.department as { name?: string } | undefined)?.name ?? departmentId
      return {
        key: id,
        kind: 'persona' as const,
        personaId: id,
        departmentId,
        roleId,
        label: id,
        detail: `${roleName} · ${departmentName}`,
        x: point.x,
        y: point.y,
        phase: hash(`${id}:p`) * Math.PI * 2,
        impact: impactOf(pathway),
        risk: riskOf(pathway),
        order: active ? index : 400 + index,
        location: String(persona.location_ID ?? ''),
        skillIds: [...skills, ...gaps],
        pathway,
        active,
      }
    })

    for (const department of departments) {
      const departmentId = String(department.ID)
      const count = Math.min(70, Math.max(8, Math.round(Number(department.personaModelCount) / 8)))
      for (let index = 0; index < count; index += 1) {
        const seed = `${departmentId}:d:${index}`
        const point = place(departmentId, seed, hash(seed) > 0.72 ? 250 : 368)
        const inScope = departmentId === scenarioDepartment
        nodes.push({
          key: seed,
          kind: 'density',
          departmentId,
          roleId: '',
          label: String(department.name),
          detail: 'Cohort density · synthetic model mass, not an individual persona',
          x: point.x,
          y: point.y,
          phase: hash(`${seed}:p`) * Math.PI * 2,
          impact: inScope ? 0.48 : 0.22,
          risk: inScope && department.riskExposure === 'Elevated' ? 'medium' : 'low',
          order: 800 + index,
          location: '',
          skillIds: [],
          active: inScope,
        })
      }
    }
    nodes.sort((left, right) => left.order - right.order)
    nodes.forEach((node, index) => {
      node.order = index
    })
    const present = new Set(personas.map((persona) => String(persona.ID)))
    const links: FieldLink[] = []
    const seen = new Set<string>()
    for (const persona of personas) {
      const id = String(persona.ID)
      links.push({ from: id, to: 'core' })
      const manager = persona.manager_ID ? String(persona.manager_ID) : ''
      if (manager && present.has(manager)) {
        const key = [id, manager].sort().join(':')
        if (!seen.has(key)) {
          seen.add(key)
          links.push({ from: id, to: manager })
        }
      }
    }
    return { nodes, links }
  }

  function createEarth(canvas: HTMLCanvasElement, hooks: { onPersona: (id: string) => void; onPhase: (label: string) => void }) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const maybeContext = canvas.getContext('2d')
    if (!maybeContext) throw new Error('Canvas is unavailable.')
    const context: CanvasRenderingContext2D = maybeContext
    let nodes: PersonaNode[] = []
    let links: FieldLink[] = []
    let filters: Filters = { query: '', departmentId: '', roleId: '', skillId: '', location: '', impact: '', risk: '' }
    let focusId: string | null = null
    let selectedId: string | null = null
    let startedAt: number | null = null
    let showLinks = true
    let showOrbits = true
    let zoom = 1
    let panX = 0
    let panY = 0
    const pointer = { x: 0, y: 0, inside: false, nx: 0, ny: 0 }
    let drag: { x: number; y: number; panX: number; panY: number; moved: boolean } | null = null
    let points: ScreenPoint[] = []
    let frame = 0
    let lastLabel = ''

    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect()
      const width = Math.max(320, rect?.width ?? window.innerWidth)
      const height = Math.max(480, rect?.height ?? window.innerHeight)
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function draw(now: number) {
      resize()
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const phase = readViz(startedAt, now)
      if (phase.label !== lastLabel) {
        lastLabel = phase.label
        hooks.onPhase(phase.label)
        if (phase.id === 'idle' && startedAt != null && now - startedAt >= 6400) startedAt = null
      }
      const coreX = width / 2 + panX
      const coreY = height / 2 + panY
      const scale = (Math.min(width, height) / 980) * zoom
      const energy = reduce ? 0.2 : phase.energy
      const time = reduce ? 0 : now / 1000
      context.clearRect(0, 0, width, height)
      context.fillStyle = '#05070A'
      context.fillRect(0, 0, width, height)
      const wash = context.createRadialGradient(coreX, coreY, 40, coreX, coreY, Math.max(width, height) * 0.55)
      wash.addColorStop(0, `rgba(53, 214, 255, ${0.05 + energy * 0.05})`)
      wash.addColorStop(0.45, 'rgba(79, 124, 255, 0.03)')
      wash.addColorStop(1, 'rgba(5, 7, 10, 0)')
      context.fillStyle = wash
      context.fillRect(0, 0, width, height)
      drawGrid(context, width, height, coreX, coreY, scale)
      if (showOrbits) drawOrbits(context, coreX, coreY, scale, time, energy)
      points = []
      const byKey = new Map<string, ScreenPoint>()
      for (const node of nodes) {
        if (!passes(node, filters)) continue
        const wobble = reduce ? 0 : Math.sin(time * 0.55 + node.phase) * (node.kind === 'persona' ? 3.2 : 1.6)
        const point = {
          key: node.key,
          sx: coreX + node.x * scale + pointer.nx * 3,
          sy: coreY + node.y * scale + pointer.ny * 2 + wobble,
          r: (node.kind === 'persona' ? 2.4 + node.impact * 3.1 : 1.15 + node.impact) * Math.max(0.85, Math.min(1.35, zoom)),
          node,
        }
        points.push(point)
        byKey.set(node.key, point)
      }
      if (showLinks) drawLinks(context, links, byKey, coreX, coreY, time, phase, selectedId)
      const activeCount = nodes.filter((node) => node.active).length
      const activeUntil = phase.id === 'idle' || phase.id === 'analyzing' ? nodes.length : Math.floor(phase.progress * activeCount)
      let seen = 0
      for (const point of points) {
        const lit = point.node.active && seen < activeUntil
        if (point.node.active) seen += 1
        drawNode(context, point, time, Boolean(focusId && point.node.departmentId !== focusId), lit, phase, selectedId === point.node.personaId)
      }
      drawCore(context, coreX, coreY, time, energy, phase)
      const fog = context.createRadialGradient(coreX, coreY, Math.min(width, height) * 0.28, coreX, coreY, Math.max(width, height) * 0.72)
      fog.addColorStop(0, 'rgba(5, 7, 10, 0)')
      fog.addColorStop(1, 'rgba(5, 7, 10, 0.55)')
      context.fillStyle = fog
      context.fillRect(0, 0, width, height)
    }

    function loop(now: number) {
      draw(now)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    function hit(x: number, y: number): ScreenPoint | null {
      let best: ScreenPoint | null = null
      let bestDistance = 18
      for (const point of points) {
        const distance = Math.hypot(point.sx - x, point.sy - y)
        if (distance < point.r + 8 && distance < bestDistance) {
          best = point
          bestDistance = distance
        }
      }
      return best
    }

    function local(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, nx: (event.clientX - rect.left) / rect.width - 0.5, ny: (event.clientY - rect.top) / rect.height - 0.5 }
    }

    canvas.addEventListener('pointermove', (event) => {
      const position = local(event)
      pointer.x = position.x
      pointer.y = position.y
      pointer.inside = true
      pointer.nx = position.nx
      pointer.ny = position.ny
      if (!drag) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (Math.hypot(dx, dy) > 4) drag.moved = true
      panX = drag.panX + dx
      panY = drag.panY + dy
    })
    canvas.addEventListener('pointerdown', (event) => {
      drag = { x: event.clientX, y: event.clientY, panX, panY, moved: false }
      canvas.setPointerCapture(event.pointerId)
    })
    canvas.addEventListener('pointerup', (event) => {
      const moved = drag?.moved
      drag = null
      if (moved) return
      const position = local(event)
      const found = hit(position.x, position.y)
      if (!found) return
      if (found.node.personaId) {
        selectedId = found.node.personaId
        hooks.onPersona(found.node.personaId)
      } else focusId = focusId === found.node.departmentId ? null : found.node.departmentId
    })
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault()
      zoom = Math.min(2.3, Math.max(0.65, zoom * (event.deltaY > 0 ? 0.92 : 1.08)))
    }, { passive: false })

    return {
      setField(nextNodes: PersonaNode[], nextLinks: FieldLink[]) {
        nodes = nextNodes
        links = nextLinks
      },
      setFilters(next: Filters) {
        filters = next
      },
      setFocus(id: string | null) {
        focusId = id
      },
      focus() {
        return focusId
      },
      setLinks(value: boolean) {
        showLinks = value
      },
      setOrbits(value: boolean) {
        showOrbits = value
      },
      zoomBy(factor: number) {
        zoom = Math.min(2.3, Math.max(0.65, zoom * factor))
      },
      reset() {
        zoom = 1
        panX = 0
        panY = 0
        focusId = null
      },
      play() {
        startedAt = performance.now()
        lastLabel = ''
      },
      destroy() {
        cancelAnimationFrame(frame)
      },
    }
  }

  return { buildField, createEarth, COHORT_ORDER, COHORT_COLOR, readViz }
})

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

function drawOrbits(context: CanvasRenderingContext2D, coreX: number, coreY: number, scale: number, time: number, energy: number) {
  context.save()
  context.translate(coreX, coreY)
  for (const radius of [150, 248, 352]) {
    context.beginPath()
    context.strokeStyle = `rgba(53, 214, 255, ${0.05 + energy * 0.04})`
    context.lineWidth = 1
    context.arc(0, 0, radius * scale, time * 0.02, Math.PI * 2)
    context.stroke()
  }
  context.restore()
}

function drawLinks(context: CanvasRenderingContext2D, links: FieldLink[], byKey: Map<string, ScreenPoint>, coreX: number, coreY: number, time: number, phase: Phase, selectedId: string | null) {
  for (const link of links) {
    const from = byKey.get(link.from)
    if (!from || from.node.kind !== 'persona') continue
    const to = link.to === 'core' ? null : byKey.get(link.to)
    if (link.to !== 'core' && !to) continue
    const emphasized = from.node.personaId === selectedId || to?.node.personaId === selectedId
    const simulating = phase.id !== 'idle' && from.node.active
    if (link.to !== 'core' && !emphasized) continue
    const x2 = to ? to.sx : coreX
    const y2 = to ? to.sy : coreY
    context.beginPath()
    context.moveTo(from.sx, from.sy)
    context.lineTo(x2, y2)
    context.strokeStyle = emphasized || simulating ? 'rgba(53, 214, 255, 0.75)' : 'rgba(80, 150, 190, 0.15)'
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

function drawNode(context: CanvasRenderingContext2D, point: ScreenPoint, time: number, dim: boolean, lit: boolean, phase: Phase, selected: boolean) {
  const color = point.node.risk === 'high' ? '#FF5C67' : point.node.risk === 'medium' ? '#FFB84D' : COHORT_COLOR[point.node.departmentId] ?? '#35D6FF'
  const pulse = point.node.risk === 'high' ? 0.55 + Math.sin(time * 4.2 + point.node.phase) * 0.45 : 1
  const waveHit = phase.wave > 0 && Math.abs(Math.hypot(point.node.x, point.node.y) / 430 - phase.wave) < 0.08
  context.save()
  context.globalAlpha = dim ? 0.12 : 0.35 * pulse
  context.strokeStyle = color
  context.beginPath()
  context.arc(point.sx, point.sy, point.r + 3.5, 0, Math.PI * 2)
  context.stroke()
  context.globalAlpha = dim ? 0.16 : waveHit || lit || selected ? 1 : 0.82
  context.fillStyle = color
  context.beginPath()
  context.arc(point.sx, point.sy, point.r, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawCore(context: CanvasRenderingContext2D, x: number, y: number, time: number, energy: number, phase: Phase) {
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
  context.arc(0, 0, 78, time * 0.25, Math.PI * 1.65 + time)
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
    context.fillStyle = index % 2 ? '#8BE7FF' : '#4F7CFF'
    context.globalAlpha = 0.75
    context.beginPath()
    context.arc(Math.cos(angle) * (92 + (index % 2) * 10), Math.sin(angle) * (92 + (index % 2) * 10), 1.7, 0, Math.PI * 2)
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

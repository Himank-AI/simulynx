import {
  BarChart3,
  Bell,
  FileText,
  GitCompare,
  History,
  LayoutDashboard,
  Menu,
  Network,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Users,
  Waypoints,
  Workflow,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn.ts'
import { useStore } from '../state/store.tsx'
import { getDepartment, getRole, listPersonas, skillName } from '../services/workforce/workforceService.ts'
import { Mark, buttonClass } from './ui.tsx'
import { JouleDrawer } from './joule-drawer.tsx'
import { PersonaDrawer } from './persona-drawer.tsx'
import { VizDirector } from './viz-director.tsx'

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/workforce', label: 'Digital Workforce', icon: Network },
  { to: '/personas', label: 'Personas', icon: Users },
  { to: '/studio', label: 'Scenario Studio', icon: Workflow },
  { to: '/simulations', label: 'Simulations', icon: BarChart3 },
  { to: '/compare', label: 'Scenario Comparison', icon: GitCompare },
  { to: '/what-if', label: 'What If', icon: SlidersHorizontal },
  { to: '/skills', label: 'Skills & Mobility', icon: Waypoints },
  { to: '/stress', label: 'Stress Test', icon: ShieldAlert },
  { to: '/brief', label: 'Decision Brief', icon: FileText },
  { to: '/history', label: 'History', icon: History },
]

const TITLES: Record<string, string> = {
  '/': 'Scenario Studio',
  '/overview': 'Overview',
  '/workforce': 'Digital Workforce',
  '/personas': 'Personas',
  '/studio': 'Scenario Studio',
  '/simulations': 'Simulations',
  '/compare': 'Scenario Comparison',
  '/what-if': 'What If',
  '/skills': 'Skills & Mobility',
  '/stress': 'Stress Test',
  '/brief': 'Decision Brief',
  '/history': 'History',
  '/settings': 'Settings',
}

type Menu = 'org' | 'user' | 'bell' | null

interface Hit {
  id: string
  title: string
  subtitle: string
  kind: 'persona' | 'scenario' | 'page'
  to: string
  personaId?: string
  historyId?: string
}

export function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const store = useStore()
  const [navOpen, setNavOpen] = useState(false)
  const [menu, setMenu] = useState<Menu>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = `SIMULYNX — ${TITLES[location.pathname] ?? 'Simulate before you commit'}`
    setNavOpen(false)
    setMenu(null)
    setSearchOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(null)
        setNavOpen(false)
        setSearchOpen(false)
        store.closeJoule()
        store.closePersona()
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const tag = (event.target as HTMLElement | null)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        event.preventDefault()
        const earthSearch = document.getElementById('earth-search')
        if (location.pathname === '/overview' && earthSearch instanceof HTMLInputElement) earthSearch.focus()
        else searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [store, location.pathname])

  const earth = location.pathname === '/overview'
  const hits = useMemo(() => searchHits(query, store.history), [query, store.history])

  const notifications = [
    { id: 'done', title: 'Simulation complete', body: store.result.scenario.name, to: '/simulations' },
    { id: 'stress', title: 'Stress test ready', body: 'Six assumptions can be challenged for the committed run.', to: '/stress' },
    { id: 'compare', title: 'Comparison set', body: 'Baseline, 20%, reskilling, redeployment, and 10% are on record.', to: '/compare' },
  ]

  function choose(hit: Hit) {
    if (hit.personaId) {
      store.openPersona(hit.personaId)
      navigate(`/personas?q=${encodeURIComponent(hit.personaId)}`)
    } else if (hit.historyId) {
      store.restore(hit.historyId)
      navigate('/simulations')
    } else {
      navigate(hit.to)
    }
    setQuery('')
    setSearchOpen(false)
  }

  return (
    <div className="min-h-screen bg-canvas text-ink-900 lg:flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-white/10 bg-void/80 backdrop-blur-xl transition-transform lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0',
          earth ? 'w-[72px]' : 'w-60',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <Mark />
          <div className={cn('min-w-0', earth && 'sr-only')}>
            <div className="text-sm font-semibold tracking-[0.16em] text-ink-950">SIMULYNX</div>
            <div className="text-[11px] text-ink-400">Simulate before you commit</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-600 transition-colors hover:bg-canvas hover:text-ink-900',
                  isActive && 'bg-brand-50 font-medium text-brand-700',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className={cn(earth && 'sr-only')}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <button type="button" className={cn(buttonClass('primary'), 'w-full')} onClick={() => store.openJoule()} title="Joule">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className={cn(earth && 'sr-only')}>Joule</span>
          </button>
          <NavLink
            to="/settings"
            title="Settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-600 hover:bg-canvas',
                isActive && 'bg-brand-50 font-medium text-brand-700',
              )
            }
          >
            <Settings className="h-4 w-4" aria-hidden />
            <span className={cn(earth && 'sr-only')}>Settings</span>
          </NavLink>
        </div>
      </aside>

      {navOpen ? (
        <button type="button" className="fixed inset-0 z-30 bg-void/30 lg:hidden" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
      ) : null}

      <div className="relative min-w-0 flex-1">
        <header className={cn('z-20 border-b border-white/10', earth ? 'pointer-events-none absolute inset-x-0 top-0 border-transparent bg-transparent' : 'sticky top-0 bg-void/75 backdrop-blur-xl')}>
          <div className={cn('flex h-14 items-center gap-2 px-3 lg:px-4', earth && 'pointer-events-auto')}>
            <button type="button" className="rounded-md p-2 text-ink-700 hover:bg-canvas lg:hidden" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 md:flex">
              <Mark className="h-7 w-7" />
              <span className="text-sm font-semibold tracking-[0.14em] text-ink-950">SIMULYNX</span>
            </div>
            <div className="relative">
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-sm text-ink-800 hover:bg-canvas"
                aria-expanded={menu === 'org'}
                onClick={() => setMenu(menu === 'org' ? null : 'org')}
              >
                <span className="max-w-40 truncate">Demo Enterprise</span>
              </button>
              {menu === 'org' ? (
                <div className="absolute left-0 top-11 z-30 w-72 rounded-lg border border-line bg-surface p-3 text-sm shadow-card">
                  <div className="font-medium text-ink-950">Demo Enterprise</div>
                  <p className="mt-1 text-xs leading-5 text-ink-500">Synthetic dataset for this simulation environment.</p>
                  <div className="mt-3 border-t border-line pt-3 text-xs leading-5 text-ink-500">
                    Connecting another organization needs a live SAP HANA Cloud adapter. This prototype is not connected.
                  </div>
                </div>
              ) : null}
            </div>
            <div className={cn('relative min-w-0 flex-1', earth && 'hidden')}>
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-300" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search personas, scenarios, screens"
                aria-label="Search"
                className="h-9 w-full rounded-md border border-line bg-canvas pl-8 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-surface"
              />
              {searchOpen && query.trim() ? (
                <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
                  {hits.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-ink-500">Nothing in the synthetic workforce or the runs on record matches that.</div>
                  ) : (
                    <ul>
                      {hits.map((hit) => (
                        <li key={hit.id}>
                          <button type="button" className="flex w-full flex-col px-3 py-2 text-left hover:bg-canvas" onClick={() => choose(hit)}>
                            <span className="text-sm text-ink-950">{hit.title}</span>
                            <span className="text-xs text-ink-400">{hit.subtitle}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="relative rounded-md p-2 text-ink-600 hover:bg-canvas"
              aria-label="Notifications"
              aria-expanded={menu === 'bell'}
              onClick={() => {
                setMenu(menu === 'bell' ? null : 'bell')
                store.markNotificationsRead()
              }}
            >
              <Bell className="h-4 w-4" />
              {!store.notificationsRead ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" /> : null}
            </button>
            <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => store.openJoule()}>
              <Sparkles className="h-3.5 w-3.5 text-brand-700" aria-hidden />
              Joule
            </button>
            <div className="relative">
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-md px-1.5 hover:bg-canvas"
                aria-label="User menu"
                aria-expanded={menu === 'user'}
                onClick={() => setMenu(menu === 'user' ? null : 'user')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-medium text-void">DM</span>
              </button>
              {menu === 'user' ? (
                <div className="absolute right-0 top-11 z-30 w-64 rounded-lg border border-line bg-surface p-3 text-sm shadow-card">
                  <div className="font-medium text-ink-950">Demo Decision Maker</div>
                  <div className="text-xs text-ink-500">Workforce strategy · local session</div>
                  <p className="mt-2 text-xs leading-5 text-ink-500">Authentication is not connected in this prototype.</p>
                  <button
                    type="button"
                    className={cn(buttonClass('secondary', 'sm'), 'mt-3 w-full')}
                    onClick={() => {
                      store.resetDemo()
                      setMenu(null)
                      navigate('/')
                    }}
                  >
                    Reset demo session
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          {menu === 'bell' ? (
            <div className="absolute right-16 top-14 z-30 w-80 rounded-lg border border-line bg-surface p-2 shadow-card">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left hover:bg-canvas"
                  onClick={() => {
                    setMenu(null)
                    navigate(item.to)
                  }}
                >
                  <div className="text-sm font-medium text-ink-950">{item.title}</div>
                  <div className="text-xs leading-5 text-ink-500">{item.body}</div>
                </button>
              ))}
            </div>
          ) : null}
          {earth ? null : (
            <div className="flex h-8 items-center border-t border-white/10 bg-surface-2 px-4 text-[11px] text-ink-500">
              <span className="truncate">Simulation environment using synthetic enterprise data. Mock adapters only — not connected to live SAP systems.</span>
            </div>
          )}
        </header>
        <main className={earth ? 'h-screen overflow-hidden' : 'px-4 py-5 lg:px-6'}>
          <div key={location.pathname} className={earth ? 'h-full' : 'enter mx-auto max-w-[1360px]'}>
            <Outlet />
          </div>
        </main>
      </div>
      {menu || searchOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-10 cursor-default"
          aria-label="Dismiss menus"
          onClick={() => {
            setMenu(null)
            setSearchOpen(false)
          }}
        />
      ) : null}
      <VizDirector />
      <JouleDrawer />
      <PersonaDrawer />
    </div>
  )
}

function searchHits(
  query: string,
  history: { id: string; scenario: { name: string; rawPrompt: string } }[],
): Hit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 1) return []
  const hits: Hit[] = []
  for (const item of NAV) {
    if (item.label.toLowerCase().includes(q)) {
      hits.push({ id: `page-${item.to}`, title: item.label, subtitle: 'Screen', kind: 'page', to: item.to })
    }
  }
  if ('settings'.includes(q)) hits.push({ id: 'page-settings', title: 'Settings', subtitle: 'Screen', kind: 'page', to: '/settings' })
  for (const persona of listPersonas()) {
    const role = getRole(persona.roleId)?.name ?? ''
    const department = getDepartment(persona.departmentId).name
    const skills = [...persona.currentSkills.map((skill) => skillName(skill.skillId)), ...persona.skillGapIds.map((id) => skillName(id))]
    const haystack = [persona.personaId, role, department, persona.location, persona.careerTrajectory, ...skills].join(' ').toLowerCase()
    if (haystack.includes(q)) {
      hits.push({
        id: persona.personaId,
        title: `${persona.personaId} · ${role}`,
        subtitle: `${department} · synthetic persona`,
        kind: 'persona',
        to: '/personas',
        personaId: persona.personaId,
      })
    }
    if (hits.filter((hit) => hit.kind === 'persona').length >= 5) break
  }
  for (const entry of history) {
    if (`${entry.scenario.name} ${entry.scenario.rawPrompt}`.toLowerCase().includes(q)) {
      hits.push({
        id: entry.id,
        title: entry.scenario.name,
        subtitle: 'Simulation on record',
        kind: 'scenario',
        to: '/simulations',
        historyId: entry.id,
      })
    }
  }
  return hits.slice(0, 8)
}

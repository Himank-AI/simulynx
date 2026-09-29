import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PATHWAY_ORDER } from '../content.ts'
import { formatNumber } from '../lib/format.ts'
import type { AnalyticsStory } from '../types.ts'

interface TipRow {
  name?: string
  value?: number | string
  color?: string
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: TipRow[]; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-card">
      {label ? <div className="mb-1 font-medium text-ink-900">{label}</div> : null}
      {payload.map((item) => (
        <div key={`${item.name}-${item.value}`} className="text-ink-600">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: item.color ?? '#35D6FF' }} />
          {item.name}: {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
        </div>
      ))}
    </div>
  )
}

const axisTick = { fill: '#7F8B9A', fontSize: 12 }

export function PathwayDonut({ story }: { story: AnalyticsStory }) {
  const data = story.pathwaySeries.filter((item) => item.value > 0)
  if (!data.length) return <p className="text-sm text-ink-500">No decision-affected population in this run.</p>
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[220px_1fr]">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={1.5} stroke="#fff">
              {data.map((item) => (
                <Cell key={item.key} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5">
        {story.pathwaySeries.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-ink-700">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.fill }} />
              {item.name}
            </span>
            <span className="tabular-nums text-ink-950">{formatNumber(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DepartmentBars({ story }: { story: AnalyticsStory }) {
  if (!story.departmentSeries.length) return <p className="text-sm text-ink-500">No department exposure in this run.</p>
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={story.departmentSeries} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }}>
          <CartesianGrid stroke="#243040" horizontal={false} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={148} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="affected" name="Affected" fill="#35D6FF" barSize={14} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ComparisonBars({
  rows,
}: {
  rows: { name: string; affected: number; reskill: number; redeploy: number; highRisk: number }[]
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#243040" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="reskill" name="Reskill" fill="#35D6FF" radius={[2, 2, 0, 0]} />
          <Bar dataKey="redeploy" name="Redeploy" fill="#36E0A0" radius={[2, 2, 0, 0]} />
          <Bar dataKey="highRisk" name="High transition risk" fill="#FF5C67" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SkillBars({ rows }: { rows: { name: string; personas: number }[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }}>
          <CartesianGrid stroke="#243040" horizontal={false} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={168} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="personas" name="Representative personas" fill="#35D6FF" barSize={12} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CounterfactualBars({
  committed,
  varied,
}: {
  committed: Record<(typeof PATHWAY_ORDER)[number], number>
  varied: Record<(typeof PATHWAY_ORDER)[number], number>
}) {
  const data = PATHWAY_ORDER.map((key) => ({
    name: key === 'HIGH_TRANSITION_RISK' ? 'High risk' : key === 'ADDITIONAL_INTERVENTION' ? 'Add. intervention' : key === 'ROLE_REDESIGN' ? 'Redesign' : key[0] + key.slice(1).toLowerCase(),
    Committed: committed[key],
    Counterfactual: varied[key],
  }))
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#243040" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="Committed" fill="#9AA8B8" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Counterfactual" fill="#35D6FF" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

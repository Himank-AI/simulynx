import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import type { Band, RiskLevel } from '../types.ts'
import { riskTone } from '../lib/format.ts'

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8 shrink-0', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#080C12" />
      <circle cx="10" cy="16" r="2.2" fill="#8BE7FF" />
      <circle cx="22" cy="10" r="2.2" fill="#35D6FF" />
      <circle cx="22" cy="22" r="2.2" fill="#4F7CFF" />
      <path d="M12.2 16H19.5M20.3 11.4 12.6 15.2M20.3 20.6 12.6 16.8" stroke="#35D6FF" strokeWidth="1.2" />
    </svg>
  )
}

export function buttonClass(variant: 'primary' | 'secondary' | 'ghost' = 'primary', size: 'sm' | 'md' = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
    size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm',
    variant === 'primary' && 'bg-brand-500 text-void hover:bg-brand-600',
    variant === 'secondary' && 'border border-line bg-surface text-ink-900 hover:bg-canvas',
    variant === 'ghost' && 'text-ink-700 hover:bg-canvas',
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' }) {
  return <button type={type} className={cn(buttonClass(variant, size), className)} {...props} />
}

const badgeTones = {
  good: 'bg-good-50 text-good-700',
  warn: 'bg-warn-50 text-warn-700',
  bad: 'bg-bad-50 text-bad-700',
  neutral: 'bg-canvas text-ink-600',
  brand: 'bg-brand-50 text-brand-700',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof badgeTones
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge tone={riskTone(level)}>{level}</Badge>
}

export function BandBadge({ label, value }: { label: string; value: Band }) {
  const tone = value === 'High' ? 'warn' : value === 'Low' ? 'neutral' : 'brand'
  return (
    <Badge tone={tone}>
      {label} {value}
    </Badge>
  )
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker ? <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">{kicker}</div> : null}
        <h1 className="mt-1 text-[1.6rem] font-semibold tracking-tight text-ink-950">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('rounded-xl border border-line bg-surface shadow-card', className)}>
      {title || action ? (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-ink-950">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs leading-5 text-ink-500">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">{label}</div>
      <div className="mt-1 text-[1.45rem] font-semibold tabular-nums tracking-tight text-ink-950">{value}</div>
      {hint ? <div className="mt-1 text-xs leading-5 text-ink-500">{hint}</div> : null}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
      {children}
    </label>
  )
}

export const fieldClass =
  'h-9 w-full rounded-md border border-line bg-surface px-2.5 text-sm text-ink-900 outline-none focus:border-brand-500'

export function MetricNote({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-canvas px-3 py-2 text-sm text-ink-500">{children}</p>
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-500">{children}</div>
}

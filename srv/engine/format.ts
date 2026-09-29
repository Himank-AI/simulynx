import type { Band, RiskLevel } from './types.ts'

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function signedPercent(value: number): string {
  const rounded = round1(value)
  const text = `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`
  return text
}

export function percentLabel(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export function yearsLabel(value: number): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1)
  return `${rounded} ${value === 1 ? 'year' : 'years'}`
}

export function relativeTime(iso: string, now = Date.now()): string {
  const delta = Math.max(0, now - new Date(iso).getTime())
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 36) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function bandValue(band: Band): number {
  if (band === 'High') return 0.85
  if (band === 'Medium') return 0.55
  return 0.25
}

export function riskTone(level: RiskLevel): 'good' | 'neutral' | 'warn' | 'bad' {
  if (level === 'Low') return 'good'
  if (level === 'Moderate') return 'neutral'
  if (level === 'Elevated') return 'warn'
  return 'bad'
}

export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function allocate(total: number, weights: number[]): number[] {
  if (total <= 0 || weights.length === 0) return weights.map(() => 0)
  const sum = weights.reduce((acc, weight) => acc + weight, 0)
  if (sum <= 0) return weights.map(() => 0)
  const exact = weights.map((weight) => (total * Math.max(0, weight)) / sum)
  const floors = exact.map((value) => Math.floor(value))
  let remainder = total - floors.reduce((acc, value) => acc + value, 0)
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const item of order) {
    if (remainder <= 0) break
    floors[item.index] += 1
    remainder -= 1
  }
  return floors
}

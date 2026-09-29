export function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 'true' || value === '1'
}

export function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value) return value
  return new Date().toISOString()
}

export function clip(value: string, length: number): string {
  return value.length <= length ? value : value.slice(0, length)
}

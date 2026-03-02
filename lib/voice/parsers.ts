import { toMeasurementKey } from '@/lib/utils/measurement-records'

const MEASUREMENT_ALIASES: Record<string, string> = {
  chest: 'chest',
  bust: 'chest',
  waist: 'waist',
  hip: 'hip',
  hips: 'hip',
  neck: 'neck',
  shoulder: 'shoulder_width',
  'shoulder width': 'shoulder_width',
  sleeve: 'sleeve_length',
  'sleeve length': 'sleeve_length',
  inseam: 'inseam',
  outseam: 'outseam',
  thigh: 'thigh',
  knee: 'knee',
  calf: 'calf',
  ankle: 'ankle',
  wrist: 'wrist',
  elbow: 'elbow',
  height: 'height',
}

export function isYes(message: string) {
  return /\b(yes|yeah|yep|correct|confirm|proceed|go ahead|do it)\b/i.test(message)
}

export function isNo(message: string) {
  return /\b(no|nope|cancel|don'?t|stop)\b/i.test(message)
}

export function isSkip(message: string) {
  return /^\s*(skip|none|no|not now|n\/a)\s*$/i.test(message)
}

export function parseFullName(message: string) {
  const cleaned = message
    .replace(/\b(my name is|name is|it is|it's)\b/gi, '')
    .replace(/[^a-zA-Z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length < 2) return null

  const firstName = capitalize(parts[0])
  const lastName = capitalize(parts.slice(1).join(' '))
  return { firstName, lastName }
}

export function parsePhone(message: string) {
  const match = message.match(/(\+?\d[\d\s()-]{6,}\d)/)
  return match?.[1]?.trim() ?? null
}

export function parseEmail(message: string) {
  const match = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0]?.toLowerCase() ?? null
}

export function parseOrderNumber(message: string) {
  const match = message.match(/\b(ORD-\d+)\b/i)
  return match?.[1]?.toUpperCase() ?? null
}

export function parseOrderStatus(message: string) {
  const normalized = message.toLowerCase().replace(/\s+/g, '_')
  if (normalized.includes('in_progress') || normalized.includes('in-progress')) {
    return 'in_progress' as const
  }
  if (normalized.includes('pending')) return 'pending' as const
  if (normalized.includes('completed')) return 'completed' as const
  if (normalized.includes('delivered')) return 'delivered' as const
  if (normalized.includes('cancelled') || normalized.includes('canceled')) {
    return 'cancelled' as const
  }
  return null
}

export function parseIsoDate(message: string) {
  const match = message.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (!match) return null
  const value = new Date(match[1])
  return Number.isNaN(value.getTime()) ? null : match[1]
}

export function parseNumber(message: string) {
  const match = message.match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number.parseFloat(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

export function extractNameQuery(message: string) {
  return message
    .replace(/^(find|search|look\s+up)\s+customer\s*/i, '')
    .trim()
}

export function parseMeasurements(message: string) {
  const extracted: Record<string, number> = {}
  const lower = message.toLowerCase()

  for (const [alias, key] of Object.entries(MEASUREMENT_ALIASES)) {
    const escaped = alias.replace(/\s+/g, '\\s+')
    const pattern = new RegExp(`${escaped}\\s*(?:is|:)?\\s*(\\d+(?:\\.\\d+)?)`, 'i')
    const match = lower.match(pattern)
    if (!match) continue

    const value = Number.parseFloat(match[1])
    if (!Number.isFinite(value) || value <= 0) continue
    extracted[key] = value
  }

  return extracted
}

export function parseCustomMeasurementPairs(message: string) {
  const extracted: Record<string, number> = {}
  const chunks = message.split(',').map((part) => part.trim())
  for (const chunk of chunks) {
    const match = chunk.match(/^([a-zA-Z][a-zA-Z\s'-]{1,30})\s+(\d+(?:\.\d+)?)$/)
    if (!match) continue
    const key = toMeasurementKey(match[1])
    const value = Number.parseFloat(match[2])
    if (!key || !Number.isFinite(value) || value <= 0) continue
    extracted[key] = value
  }
  return extracted
}

export function capitalize(value: string) {
  if (!value) return ''
  return value[0].toUpperCase() + value.slice(1).toLowerCase()
}

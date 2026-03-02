import {
  STANDARD_MEASUREMENT_KEYS,
  STANDARD_MEASUREMENT_LABELS,
  STANDARD_MEASUREMENT_ORDER,
} from '@/lib/constants/measurements'

export type MeasurementMap = Record<string, number>

const RESERVED_MEASUREMENT_COLUMNS = new Set([
  'id',
  'shop_id',
  'customer_id',
  'notes',
  'status',
  'created_by',
  'created_at',
  'updated_at',
  'customers',
  'standard_measurements',
  'custom_measurements',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toMeasurementKey(rawKey: string): string {
  return rawKey
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function toMeasurementNumber(rawValue: unknown): number | null {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue
  }

  if (typeof rawValue === 'string') {
    const parsed = Number.parseFloat(rawValue)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

export function sanitizeMeasurementMap(input: unknown): MeasurementMap {
  if (!isRecord(input)) {
    return {}
  }

  const sanitized: MeasurementMap = {}
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = toMeasurementKey(rawKey)
    if (!key) continue

    const value = toMeasurementNumber(rawValue)
    if (value !== null) {
      sanitized[key] = value
    }
  }

  return sanitized
}

export function extractMeasurementMaps(row: Record<string, unknown>): {
  standard: MeasurementMap
  custom: MeasurementMap
  all: MeasurementMap
} {
  const standardFromJson = sanitizeMeasurementMap(row.standard_measurements)
  const customFromJson = sanitizeMeasurementMap(row.custom_measurements)

  const standard: MeasurementMap = { ...standardFromJson }
  const custom: MeasurementMap = { ...customFromJson }

  for (const [rawKey, rawValue] of Object.entries(row)) {
    const key = toMeasurementKey(rawKey)
    if (!key || RESERVED_MEASUREMENT_COLUMNS.has(key)) continue

    const value = toMeasurementNumber(rawValue)
    if (value === null) continue

    if (STANDARD_MEASUREMENT_KEYS.has(key)) {
      if (!(key in standard)) standard[key] = value
      continue
    }

    if (!(key in custom)) custom[key] = value
  }

  return {
    standard,
    custom,
    all: { ...standard, ...custom },
  }
}

export function formatMeasurementLabel(key: string): string {
  const normalized = toMeasurementKey(key)
  const knownLabel = STANDARD_MEASUREMENT_LABELS.get(normalized)
  if (knownLabel) return knownLabel

  return normalized
    .split('_')
    .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
    .join(' ')
}

export function sortMeasurementEntries(entries: Array<[string, number]>): Array<[string, number]> {
  return [...entries].sort(([a], [b]) => {
    const aOrder = STANDARD_MEASUREMENT_ORDER.get(a)
    const bOrder = STANDARD_MEASUREMENT_ORDER.get(b)

    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
    if (aOrder !== undefined) return -1
    if (bOrder !== undefined) return 1
    return a.localeCompare(b)
  })
}

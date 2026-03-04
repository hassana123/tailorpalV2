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

/**
 * Preprocesses voice input to clean up common transcription issues
 * This makes the assistant more robust against speech recognition errors
 */
export function preprocessVoiceInput(message: string): string {
  // Normalize to lowercase for processing
  let cleaned = message.toLowerCase().trim()
  
  // Remove repeated words (e.g., "skip skip" -> "skip", "yes yes yes" -> "yes")
  // This handles cases where speech recognition repeats words
  cleaned = cleaned.replace(/\b(\w+)(?:\s+\1)+\b/gi, '$1')
  
  // Remove common filler words that confuse parsing
  const fillers = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean']
  for (const filler of fillers) {
    cleaned = cleaned.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '')
  }
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

/**
 * Check if message is a yes response - expanded to handle more variations
 */
export function isYes(message: string) {
  const cleaned = preprocessVoiceInput(message)
  // Also check original for backwards compatibility
  return /\b(yes|yeah|yep|correct|confirm|proceed|go ahead|do it|that is correct|that is right|sure|ok|okay)\b/i.test(cleaned)
}

/**
 * Check if message is a no response - expanded to handle more variations
 */
export function isNo(message: string) {
  const cleaned = preprocessVoiceInput(message)
  return /\b(no|nope|cancel|don'?t|stop|not|negative|nah)\b/i.test(cleaned)
}

/**
 * Check if message is a skip request - fixed to handle "skip skip" and repetitions
 * This is the key fix for the issue where "skip skip" was recorded as "skip skip" instead of being recognized as skip
 */
export function isSkip(message: string) {
  const cleaned = preprocessVoiceInput(message)
  // Also accept original message for backwards compatibility
  const original = message.toLowerCase().trim()
  
  // Check both cleaned and original - handle single "skip", "skip skip", "skip skip skip"
  // Also handle "skip it", "skip this", "skip for now" etc.
  return /^\s*(skip|none|no|not now|n\/a|na|next|pass|leave it|skip it|skip this)\s*$/i.test(cleaned) ||
         /^\s*(skip|none|no|not now|n\/a|na|next|pass|leave it|skip it|skip this)\s*$/i.test(original)
}

/**
 * Check if user wants to cancel the current flow
 */
export function isCancel(message: string) {
  const cleaned = preprocessVoiceInput(message)
  return /\b(cancel|stop|start over|reset|never mind|abort|discard|forget it)\b/i.test(cleaned)
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
  // Use original message to preserve phone number structure
  // Don't preprocess as it might remove important characters
  const match = message.match(/(\+?\d[\d\s()-]{6,}\d)/)
  return match?.[1]?.trim() ?? null
}

export function parseEmail(message: string) {
  // Use original message
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

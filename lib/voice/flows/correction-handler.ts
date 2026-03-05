/**
 * Correction Handler for Voice Flows
 * Provides utilities for handling corrections and edits within multi-step flows
 */
//parseValueFromMessage
import { VoiceSession } from '@/lib/voice/types'
import { detectCorrectionIntent, isAffirmation, isRejection } from '@/lib/voice/correction-system'
import { VoiceReply } from '@/lib/voice/types'

export interface CorrectionContext {
  message: string
  session: VoiceSession
  fieldBeingConfirmed?: string
  currentValue?: any
}

/**
 * Handle a correction attempt in the middle of a flow
 * Returns a VoiceReply if correction was handled, null otherwise
 */
export function handleFlowCorrection(context: CorrectionContext): VoiceReply | null {
  const { message, fieldBeingConfirmed } = context

  // Check if this is an explicit correction
  const correction = detectCorrectionIntent(message)

  if (!correction.isCorrectionIntent) {
    return null
  }

  // If we just asked for confirmation and user says no
  if (fieldBeingConfirmed && isRejection(message)) {
    return {
      reply: `I'll need to correct that. What should the ${fieldBeingConfirmed} be?`,
    }
  }

  // If it's a generic rejection with no context
  if (correction.correctionType === 'generic_rejection' && !fieldBeingConfirmed) {
    return {
      reply: 'What would you like to correct?',
    }
  }

  // If we can extract a specific field and value
  if (correction.field && correction.newValue) {
    return {
      reply: `Got it. Changing ${correction.field} to ${correction.newValue}. Is that correct?`,
      action: 'awaiting_correction_confirmation',
    }
  }

  // If we can extract just a value (e.g., user says "no, 42")
  if (correction.newValue && fieldBeingConfirmed) {
    return {
      reply: `Changed ${fieldBeingConfirmed} to ${correction.newValue}. Is that correct?`,
      action: 'awaiting_correction_confirmation',
    }
  }

  return null
}

/**
 * Check if user is confirming a correction
 */
export function isConfirmingCorrection(message: string): boolean {
  return isAffirmation(message)
}

/**
 * Generate a confirmation prompt before saving a multi-step collection
 */
export function generateCollectionConfirmation(data: Record<string, any>, labels: Record<string, string>): string {
  const entries = Object.entries(data)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const label = labels[key] || key
      return `${label}: ${value}`
    })

  if (entries.length === 0) {
    return 'No data to save. Please provide at least one value.'
  }

  const summary = entries.join(', ')
  return `Ready to save: ${summary}. Say yes to confirm or tell me what to correct.`
}

/**
 * Handle mid-flow correction for a specific field
 * Asks user what value should be for that field
 */
export function askForFieldCorrection(fieldName: string, currentValue?: any): VoiceReply {
  const valueInfo = currentValue ? ` (currently "${currentValue}")` : ''
  return {
    reply: `What should ${fieldName} be?${valueInfo}`,
  }
}

/**
 * Apply a correction to a field in the session draft
 */
export function applyDraftCorrection(
  draft: Record<string, any>,
  field: string,
  newValue: any,
): { success: boolean; updated: Record<string, any>; message?: string } {
  if (!field || newValue === undefined) {
    return { success: false, updated: draft }
  }

  const previousValue = draft[field]
  const updated = { ...draft, [field]: newValue }

  return {
    success: true,
    updated,
    message: `Updated ${field} from ${previousValue} to ${newValue}`,
  }
}

/**
 * Check if a message indicates the user is done with a multi-step input
 */
export function isDoneWithInput(message: string): boolean {
  return /\b(done|finished|complete|that's all|thats all|next|continue)\b/i.test(message)
}

/**
 * Check if user wants to skip a field
 */
export function wantsToSkip(message: string): boolean {
  return /\b(skip|skip it|skip this|skip that)\b/i.test(message)
}

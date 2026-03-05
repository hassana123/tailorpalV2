/**
 * Correction System
 * Handles detection and application of value corrections in voice flows
 * Allows users to correct/edit values at any point without restarting
 */

export interface CorrectionDetection {
  isCorrectionIntent: boolean
  correctionType: 'generic_rejection' | 'specific_change' | 'field_change' | 'value_change' | 'none'
  field?: string
  newValue?: string | number
  confidence: number
}

/**
 * Detect if a message is a correction/edit intent
 */
export function detectCorrectionIntent(message: string): CorrectionDetection {
  const lowerMessage = message.toLowerCase().trim()
  const words = lowerMessage.split(/\s+/)

  // Generic rejection patterns (user says "no", "wrong", "incorrect", etc)
  const genericRejectionPatterns = [
    /\b(no|nope|wrong|incorrect|not correct|nope|that's wrong|thats wrong|not right|error)\b/i,
    /\b(actually|wait|hold on|correction|let me correct|correction please)\b/i,
  ]

  const isGenericRejection = genericRejectionPatterns.some((p) => p.test(lowerMessage))

  if (isGenericRejection) {
    return {
      isCorrectionIntent: true,
      correctionType: 'generic_rejection',
      confidence: 0.9,
    }
  }

  // Specific change patterns: "change X to Y", "set X to Y", "make X Y"
  const specificChangeMatch = lowerMessage.match(
    /\b(change|set|make|update|edit|correct)\s+(?:the\s+)?(\w+)\s+to\s+(.+)/i,
  )
  if (specificChangeMatch) {
    const field = specificChangeMatch[2]
    const newValue = specificChangeMatch[3].trim()
    return {
      isCorrectionIntent: true,
      correctionType: 'specific_change',
      field,
      newValue,
      confidence: 0.95,
    }
  }

  // Field-specific patterns: "chest should be", "waist is actually"
  const fieldSpecificMatch = lowerMessage.match(
    /\b(\w+)\s+(?:is|should be|actually|was)\s+(.+)/i,
  )
  if (fieldSpecificMatch && isLikelyField(fieldSpecificMatch[1])) {
    const field = fieldSpecificMatch[1]
    const newValue = fieldSpecificMatch[2].trim()
    return {
      isCorrectionIntent: true,
      correctionType: 'field_change',
      field,
      newValue,
      confidence: 0.8,
    }
  }

  // Direct value patterns: if they say a number after rejection
  const lastNumber = extractLastNumber(lowerMessage)
  if (isGenericRejection && lastNumber !== null) {
    return {
      isCorrectionIntent: true,
      correctionType: 'value_change',
      newValue: lastNumber,
      confidence: 0.75,
    }
  }

  return {
    isCorrectionIntent: false,
    correctionType: 'none',
    confidence: 0,
  }
}

/**
 * Check if a word is likely a field name
 */
function isLikelyField(word: string): boolean {
  const commonFields = [
    'chest',
    'waist',
    'sleeve',
    'length',
    'height',
    'shoulder',
    'hips',
    'inseam',
    'thigh',
    'name',
    'email',
    'phone',
    'address',
    'city',
    'country',
    'price',
    'date',
    'status',
    'fabric',
    'description',
  ]
  return commonFields.some((f) => word.includes(f))
}

/**
 * Extract the last number from a message
 * Useful for when user says "no, 42" to correct a measurement
 */
export function extractLastNumber(message: string): number | null {
  const numberPattern = /(\d+(?:\.\d+)?)/g
  const matches = message.match(numberPattern)
  if (matches && matches.length > 0) {
    const lastMatch = matches[matches.length - 1]
    return parseFloat(lastMatch)
  }
  return null
}

/**
 * Parse a specific value change from a message
 * Returns the extracted value or null if unable to parse
 */
export function parseValueFromMessage(message: string, expectedType?: 'number' | 'text' | 'email' | 'phone'): any {
  const trimmed = message.trim()

  if (expectedType === 'number') {
    const num = extractLastNumber(trimmed)
    return num
  }

  if (expectedType === 'email') {
    const emailMatch = trimmed.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    return emailMatch ? emailMatch[0] : null
  }

  if (expectedType === 'phone') {
    const phoneMatch = trimmed.match(/[\d\s\-\+\(\)]{7,}/i)
    return phoneMatch ? phoneMatch[0] : null
  }

  // Default: return the message as text (after removing common phrases)
  return trimmed
    .replace(/^(the\s+|ok\s+|sure\s+|alright\s+|yes\s+)/i, '')
    .replace(/^(is|should be|actually|was|it's|its)\s+/i, '')
    .trim()
}

/**
 * Apply a correction to an object
 * Safely updates the object with the corrected value
 */
export function applyCorrection(
  obj: Record<string, any>,
  field: string,
  newValue: any,
): { success: boolean; updated: Record<string, any>; previousValue?: any } {
  if (!obj || !field || newValue === undefined) {
    return { success: false, updated: obj }
  }

  const previousValue = obj[field]
  const updated = { ...obj, [field]: newValue }

  return {
    success: true,
    updated,
    previousValue,
  }
}

/**
 * Generate a confirmation message for a correction
 */
export function generateCorrectionConfirmation(
  field: string,
  previousValue: any,
  newValue: any,
): string {
  const displayPrevious = previousValue !== undefined ? previousValue : 'empty'
  return `Changed ${field} from ${displayPrevious} to ${newValue}. Is that correct?`
}

/**
 * Normalize field names to canonical form
 * E.g., "customer name" -> "firstName", "phone number" -> "phone"
 */
export function normalizeFieldName(input: string): string {
  const mapping: Record<string, string> = {
    'first name': 'firstName',
    'last name': 'lastName',
    'full name': 'fullName',
    'phone number': 'phone',
    'email address': 'email',
    'body measurements': 'measurements',
    'chest measurement': 'chest',
    'waist measurement': 'waist',
    'sleeve length': 'sleeve',
    'order status': 'status',
    'due date': 'dueDate',
    'total price': 'totalPrice',
  }

  const normalized = input.toLowerCase().trim()
  return mapping[normalized] || normalized
}

/**
 * Check if message is a strong affirmation
 */
export function isAffirmation(message: string): boolean {
  return /\b(yes|yep|yeah|yup|correct|right|ok|okay|sure|good|that's right|thats right|perfect|confirm)\b/i.test(
    message,
  )
}

/**
 * Check if message is a strong rejection
 */
export function isRejection(message: string): boolean {
  return /\b(no|nope|wrong|incorrect|not correct|cancel|stop)\b/i.test(message)
}

/**
 * Format a measurement correction for display
 * E.g., "Changed chest from 40 to 42 inches"
 */
export function formatMeasurementCorrection(
  field: string,
  previousValue: number,
  newValue: number,
  unit: string = 'inches',
): string {
  return `Changed ${field} from ${previousValue} to ${newValue} ${unit}.`
}

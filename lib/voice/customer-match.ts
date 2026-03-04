type CustomerLike = {
  id: string
  first_name: string
  last_name: string
}

/**
 * Enhanced customer matching that handles voice transcription issues
 * and is more flexible with name matching
 */
export function pickCustomerFromMessage(customers: CustomerLike[], message: string) {
  // Preprocess the message
  const normalized = preprocessForMatching(message)
  if (!normalized) return null

  // 1. Exact match (full name)
  const exact = customers.find((customer) => {
    const full = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    return full === normalized
  })
  if (exact) return exact

  // 2. Contains match (full name contains query or vice versa)
  const byFullContains = customers.filter((customer) => {
    const full = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    return full.includes(normalized) || normalized.includes(full)
  })
  if (byFullContains.length === 1) return byFullContains[0]

  // 3. First name exact match
  const firstNameMatches = customers.filter(
    (customer) => customer.first_name.toLowerCase() === normalized,
  )
  if (firstNameMatches.length === 1) return firstNameMatches[0]

  // 4. Last name exact match
  const lastNameMatches = customers.filter(
    (customer) => customer.last_name.toLowerCase() === normalized,
  )
  if (lastNameMatches.length === 1) return lastNameMatches[0]

  // 5. Partial first name match (for when user says just part of name)
  const partialFirstName = customers.filter(
    (customer) => customer.first_name.toLowerCase().startsWith(normalized) || 
                  normalized.startsWith(customer.first_name.toLowerCase()),
  )
  if (partialFirstName.length === 1) return partialFirstName[0]

  // 6. Handle numbered list selection (e.g., "number 1" or "the first one")
  const numberMatch = normalized.match(/\b(?:number|#|option)?\s*(\d+)\b/)
  if (numberMatch) {
    const index = parseInt(numberMatch[1], 10) - 1
    if (index >= 0 && index < customers.length) {
      return customers[index]
    }
  }

  // 7. Handle "first", "second", "third" etc.
  const ordinalWords: Record<string, number> = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10
  }
  for (const [word, num] of Object.entries(ordinalWords)) {
    if (normalized.includes(word) && num <= customers.length) {
      return customers[num - 1]
    }
  }

  // Return first match if multiple partial matches
  if (byFullContains.length > 0) return byFullContains[0]
  if (partialFirstName.length > 0) return partialFirstName[0]

  return null
}

/**
 * Preprocess message for customer matching
 * Removes common phrases and cleans up voice transcription issues
 */
function preprocessForMatching(message: string): string {
  let cleaned = message.toLowerCase().trim()
  
  // Remove common prefixes that users might say
  const prefixesToRemove = [
    '^the\\s+', '^customer\\s+', '^for\\s+', '^to\\s+', 
    '^name\\s+is\\s+', '^it\\s+is\\s+', "^i\\s+want\\s+",
    "^find\\s+", "^search\\s+for\\s+", "^look\\s+up\\s+",
    "^number\\s+", "^#", "^option\\s+"
  ]
  
  for (const prefix of prefixesToRemove) {
    cleaned = cleaned.replace(new RegExp(prefix, 'i'), '')
  }
  
  // Remove repeated words
  cleaned = cleaned.replace(/\\b(\\w+)(?:\\s+\\1)+\\b/gi, '$1')
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\\s+/g, ' ').trim()
  
  return cleaned
}

export function formatCustomerList(customers: CustomerLike[], limit = 12) {
  if (!customers.length) return 'No customers found.'
  return customers
    .slice(0, limit)
    .map((customer, index) => `${index + 1}. ${customer.first_name} ${customer.last_name}`)
    .join('\n')
}

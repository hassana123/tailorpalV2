type CustomerLike = {
  id: string
  first_name: string
  last_name: string
}

export function pickCustomerFromMessage(customers: CustomerLike[], message: string) {
  const normalized = message.trim().toLowerCase()
  if (!normalized) return null

  const exact = customers.find((customer) => {
    const full = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    return full === normalized
  })
  if (exact) return exact

  const byFullContains = customers.filter((customer) => {
    const full = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    return full.includes(normalized) || normalized.includes(full)
  })
  if (byFullContains.length === 1) return byFullContains[0]

  const firstNameMatches = customers.filter(
    (customer) => customer.first_name.toLowerCase() === normalized,
  )
  if (firstNameMatches.length === 1) return firstNameMatches[0]

  return null
}

export function formatCustomerList(customers: CustomerLike[], limit = 12) {
  if (!customers.length) return 'No customers found.'
  return customers
    .slice(0, limit)
    .map((customer, index) => `${index + 1}. ${customer.first_name} ${customer.last_name}`)
    .join('\n')
}

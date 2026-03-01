import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const levelSchema = z.enum(['country', 'state', 'city'])
const querySchema = z.string().trim().max(100).optional()
const countrySchema = z.string().trim().min(1).max(100).optional()
const stateSchema = z.string().trim().min(1).max(100).optional()

interface LocationIqResponseItem {
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

const COMMON_COUNTRIES = [
  'Australia',
  'Brazil',
  'Canada',
  'China',
  'Egypt',
  'France',
  'Germany',
  'Ghana',
  'India',
  'Ireland',
  'Italy',
  'Kenya',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Pakistan',
  'Portugal',
  'Qatar',
  'Rwanda',
  'Saudi Arabia',
  'South Africa',
  'Spain',
  'Sweden',
  'Tanzania',
  'Turkey',
  'Uganda',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Zambia',
]

const COUNTRY_STATE_FALLBACK: Record<string, string[]> = {
  nigeria: [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Federal Capital Territory',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
  ],
  'united states': [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
  ],
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function buildSearchUrl(apiKey: string, query: string, limit = 50) {
  const url = new URL('https://us1.locationiq.com/v1/search')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', String(limit))
  return url
}

export async function GET(request: NextRequest) {
  const level = levelSchema.safeParse(request.nextUrl.searchParams.get('level'))
  const query = querySchema.safeParse(request.nextUrl.searchParams.get('query') ?? undefined)
  const country = countrySchema.safeParse(request.nextUrl.searchParams.get('country') ?? undefined)
  const state = stateSchema.safeParse(request.nextUrl.searchParams.get('state') ?? undefined)

  if (!level.success || !query.success || !country.success || !state.success) {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }

  const countryValue = country.data
  const stateValue = state.data
  const queryValue = query.data

  if (level.data === 'state' && !countryValue) {
    return NextResponse.json({ error: 'Country is required for states' }, { status: 400 })
  }

  if (level.data === 'city' && (!countryValue || !stateValue)) {
    return NextResponse.json({ error: 'Country and state are required for cities' }, { status: 400 })
  }

  const normalizedQuery = queryValue ? normalize(queryValue) : ''
  const normalizedCountry = countryValue ? normalize(countryValue) : ''
  const normalizedState = stateValue ? normalize(stateValue) : ''
  const apiKey = process.env.LOCATIONIQ_API_KEY

  const getFallback = () => {
    if (level.data === 'country') {
      return uniqueSorted(
        COMMON_COUNTRIES.filter((value) =>
          normalizedQuery ? normalize(value).includes(normalizedQuery) : true,
        ),
      )
    }

    if (level.data === 'state' && normalizedCountry) {
      const fallback = COUNTRY_STATE_FALLBACK[normalizedCountry] ?? []
      return uniqueSorted(
        fallback.filter((value) =>
          normalizedQuery ? normalize(value).includes(normalizedQuery) : true,
        ),
      )
    }

    return [] as string[]
  }

  if (!apiKey) {
    return NextResponse.json({ options: getFallback() })
  }

  try {
    const searchQuery =
      level.data === 'country'
        ? queryValue || 'world'
        : level.data === 'state'
          ? [queryValue, countryValue].filter(Boolean).join(', ')
          : [queryValue, stateValue, countryValue].filter(Boolean).join(', ')

    const response = await fetch(buildSearchUrl(apiKey, searchQuery), { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ options: getFallback() })
    }

    const payload = (await response.json()) as LocationIqResponseItem[]
    let options: string[] = []

    if (level.data === 'country') {
      options = payload
        .map((item) => item.address?.country ?? '')
        .filter(Boolean)
    } else if (level.data === 'state') {
      options = payload
        .filter(
          (item) =>
            normalize(item.address?.country ?? '').includes(normalizedCountry),
        )
        .map((item) => item.address?.state ?? '')
        .filter(Boolean)
    } else {
      options = payload
        .filter(
          (item) =>
            normalize(item.address?.country ?? '').includes(normalizedCountry) &&
            normalize(item.address?.state ?? '').includes(normalizedState),
        )
        .map((item) => item.address?.city ?? item.address?.town ?? item.address?.village ?? item.address?.county ?? '')
        .filter(Boolean)
    }

    const normalizedOptions = uniqueSorted(
      options.filter((value) =>
        normalizedQuery ? normalize(value).includes(normalizedQuery) : true,
      ),
    )

    if (normalizedOptions.length > 0) {
      return NextResponse.json({ options: normalizedOptions.slice(0, 100) })
    }

    return NextResponse.json({ options: getFallback() })
  } catch (error) {
    console.error('Location option lookup failed:', error)
    return NextResponse.json({ options: getFallback() })
  }
}

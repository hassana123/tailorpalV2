import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.string().trim().min(2).max(200)
const filterSchema = z.string().trim().min(1).max(100).optional()

interface LocationIqResponseItem {
  display_name?: string
  lat?: string
  lon?: string
  address?: {
    house_number?: string
    road?: string
    suburb?: string
  }
}

interface LocationSuggestion {
  displayName: string
  address: string
  city: string
  state: string
  country: string
  lat: number
  lon: number
}

function buildSearchUrl(apiKey: string, query: string, limit = 8) {
  const url = new URL('https://us1.locationiq.com/v1/search')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', String(limit))
  return url
}

function parseLocationIqPayload(payload: unknown) {
  if (!Array.isArray(payload)) {
    return [] as LocationIqResponseItem[]
  }
  return payload as LocationIqResponseItem[]
}

function mapSuggestions(
  payload: LocationIqResponseItem[],
  context: { city?: string; state?: string; country?: string },
) {
  const selectedCity = context.city?.trim() ?? ''
  const selectedState = context.state?.trim() ?? ''
  const selectedCountry = context.country?.trim() ?? ''

  const mapped = payload
    .map((item) => {
      const displayName = item.display_name?.trim() ?? ''
      const lat = Number.parseFloat(item.lat ?? '')
      const lon = Number.parseFloat(item.lon ?? '')

      if (!displayName || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null
      }

      const compactAddress =
        [item.address?.house_number, item.address?.road, item.address?.suburb]
          .filter(Boolean)
          .join(' ')
          .trim() || displayName

      return {
        // Exact address text returned by LocationIQ (used for input autofill).
        displayName,
        // Keep short/compact line too if needed downstream.
        address: compactAddress,
        // Canonical hierarchy comes from CountriesNow selection only.
        city: selectedCity,
        state: selectedState,
        country: selectedCountry,
        lat,
        lon,
      } satisfies LocationSuggestion
    })
    .filter((value): value is LocationSuggestion => value !== null)

  const unique = new Map<string, LocationSuggestion>()
  for (const suggestion of mapped) {
    const key = `${suggestion.displayName}|${suggestion.lat}|${suggestion.lon}`
    if (!unique.has(key)) {
      unique.set(key, suggestion)
    }
  }

  return Array.from(unique.values())
}

async function fetchLocationIqSuggestions(apiKey: string, query: string) {
  const response = await fetch(buildSearchUrl(apiKey, query), { cache: 'no-store' })
  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      payload: null,
    }
  }

  const payload = await response.json()
  return {
    ok: true as const,
    status: response.status,
    payload: parseLocationIqPayload(payload),
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''
  const parsedCountryFilter = filterSchema.safeParse(
    request.nextUrl.searchParams.get('country') ?? undefined,
  )
  const parsedStateFilter = filterSchema.safeParse(
    request.nextUrl.searchParams.get('state') ?? undefined,
  )
  const parsedCityFilter = filterSchema.safeParse(
    request.nextUrl.searchParams.get('city') ?? undefined,
  )
  const parsedQuery = querySchema.safeParse(query)

  if (
    !parsedQuery.success ||
    !parsedCountryFilter.success ||
    !parsedStateFilter.success ||
    !parsedCityFilter.success
  ) {
    return NextResponse.json({ error: 'Invalid search query' }, { status: 400 })
  }

  const countryFilter = parsedCountryFilter.data
  const stateFilter = parsedStateFilter.data
  const cityFilter = parsedCityFilter.data

  const apiKey = process.env.LOCATIONIQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Location search is not configured' }, { status: 503 })
  }

  const rawQuery = parsedQuery.data
  const contextualQuery = [rawQuery, cityFilter, stateFilter, countryFilter]
    .filter(Boolean)
    .join(', ')

  const queryCandidates = Array.from(new Set([contextualQuery, rawQuery].filter(Boolean)))

  try {
    let lastFailureStatus = 0

    for (const queryCandidate of queryCandidates) {
      const result = await fetchLocationIqSuggestions(apiKey, queryCandidate)
      if (!result.ok) {
        lastFailureStatus = result.status
        continue
      }

      const suggestions = mapSuggestions(result.payload, {
        city: cityFilter,
        state: stateFilter,
        country: countryFilter,
      })

      if (suggestions.length > 0) {
        return NextResponse.json({ suggestions: suggestions.slice(0, 8) })
      }
    }

    if (lastFailureStatus >= 400) {
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 502 })
    }

    return NextResponse.json({ suggestions: [] })
  } catch (error) {
    console.error('LocationIQ lookup error:', error)
    return NextResponse.json({ error: 'Failed to search location' }, { status: 500 })
  }
}

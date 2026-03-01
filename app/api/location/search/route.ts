import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.string().trim().min(3).max(200)
const filterSchema = z.string().trim().min(1).max(100).optional()

interface LocationIqResponseItem {
  display_name: string
  lat: string
  lon: string
  address?: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''
  const parsedCountryFilter = filterSchema.safeParse(request.nextUrl.searchParams.get('country') ?? undefined)
  const parsedStateFilter = filterSchema.safeParse(request.nextUrl.searchParams.get('state') ?? undefined)
  const parsedCityFilter = filterSchema.safeParse(request.nextUrl.searchParams.get('city') ?? undefined)
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
    return NextResponse.json(
      { error: 'Location search is not configured' },
      { status: 503 },
    )
  }

  const url = new URL('https://us1.locationiq.com/v1/search')
  const combinedQuery = [parsedQuery.data, cityFilter, stateFilter, countryFilter]
    .filter((part) => Boolean(part))
    .join(', ')

  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', combinedQuery)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '6')

  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 502 },
      )
    }

    const payload = (await response.json()) as LocationIqResponseItem[]
    const normalize = (value: string) => value.trim().toLowerCase()
    const normalizedCountryFilter = countryFilter ? normalize(countryFilter) : null
    const normalizedStateFilter = stateFilter ? normalize(stateFilter) : null
    const normalizedCityFilter = cityFilter ? normalize(cityFilter) : null

    const suggestions = payload
      .map((item) => {
        const lat = Number.parseFloat(item.lat)
        const lon = Number.parseFloat(item.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return null
        }

        const city =
          item.address?.city ??
          item.address?.town ??
          item.address?.village ??
          item.address?.county ??
          ''
        const state = item.address?.state ?? ''
        const country = item.address?.country ?? ''
        if (
          normalizedCountryFilter &&
          !normalize(country).includes(normalizedCountryFilter)
        ) {
          return null
        }
        if (
          normalizedStateFilter &&
          !normalize(state).includes(normalizedStateFilter)
        ) {
          return null
        }
        if (
          normalizedCityFilter &&
          !normalize(city).includes(normalizedCityFilter)
        ) {
          return null
        }
        const addressLine = [item.address?.house_number, item.address?.road, item.address?.suburb]
          .filter(Boolean)
          .join(' ')

        return {
          displayName: item.display_name,
          address: addressLine,
          city,
          state,
          country,
          lat,
          lon,
        }
      })
      .filter((value): value is NonNullable<typeof value> => value !== null)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('LocationIQ lookup error:', error)
    return NextResponse.json({ error: 'Failed to search location' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const levelSchema = z.enum(['country', 'state', 'city'])
const querySchema = z.string().trim().max(100).optional()
const countrySchema = z.string().trim().min(1).max(100).optional()
const stateSchema = z.string().trim().min(1).max(100).optional()

const COUNTRIES_NOW_BASE_URL = 'https://countriesnow.space/api/v0.1/countries'
const COUNTRY_STATE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CITY_CACHE_TTL_MS = 12 * 60 * 60 * 1000

interface CountriesNowResponse<T> {
  error?: boolean
  msg?: string
  data?: T
}

interface CountriesNowStateEntry {
  name?: string
  state_name?: string
}

interface CountriesNowCountryEntry {
  name?: string
  country?: string
  states?: CountriesNowStateEntry[]
}

interface CountryStateCatalog {
  countries: string[]
  countryByNormalized: Map<string, string>
  statesByCountry: Map<string, string[]>
}

let cachedCountryStateCatalog: { value: CountryStateCatalog; cachedAt: number } | null = null
const cityCache = new Map<string, { value: string[]; cachedAt: number }>()

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function getIntlCountries() {
  const supportedValuesOf = (
    Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf

  if (typeof supportedValuesOf !== 'function') {
    return [] as string[]
  }

  const display = new Intl.DisplayNames(['en'], { type: 'region' })
  return uniqueSorted(
    supportedValuesOf('region')
      .map((code) => display.of(code))
      .filter((value): value is string => Boolean(value))
      .filter((value) => !/^[A-Z]{2,3}$/.test(value)),
  )
}

function parseCountryStatesPayload(payload: CountriesNowResponse<unknown>): CountryStateCatalog | null {
  if (payload.error || !Array.isArray(payload.data)) {
    return null
  }

  const countries: string[] = []
  const countryByNormalized = new Map<string, string>()
  const statesByCountry = new Map<string, string[]>()

  for (const item of payload.data as CountriesNowCountryEntry[]) {
    const country = item.name?.trim() || item.country?.trim() || ''
    if (!country) {
      continue
    }

    const normalizedCountry = normalize(country)
    countries.push(country)
    countryByNormalized.set(normalizedCountry, country)

    const states = uniqueSorted(
      (item.states ?? [])
        .map((entry) => entry.name?.trim() || entry.state_name?.trim() || '')
        .filter(Boolean),
    )

    statesByCountry.set(normalizedCountry, states)
  }

  const uniqueCountries = uniqueSorted(countries)
  return {
    countries: uniqueCountries,
    countryByNormalized,
    statesByCountry,
  }
}

async function fetchCountriesNowJson<T>(url: string): Promise<CountriesNowResponse<T> | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as CountriesNowResponse<T>
  } catch {
    return null
  }
}

async function getCountryStateCatalog() {
  if (
    cachedCountryStateCatalog &&
    Date.now() - cachedCountryStateCatalog.cachedAt < COUNTRY_STATE_CACHE_TTL_MS
  ) {
    return cachedCountryStateCatalog.value
  }

  const payload =
    (await fetchCountriesNowJson<unknown>(`${COUNTRIES_NOW_BASE_URL}/states`)) ??
    (await fetchCountriesNowJson<unknown>(`${COUNTRIES_NOW_BASE_URL}/states/`))

  const parsed = payload ? parseCountryStatesPayload(payload) : null
  if (!parsed) {
    return null
  }

  cachedCountryStateCatalog = { value: parsed, cachedAt: Date.now() }
  return parsed
}

function parseCountryStateResult(payload: CountriesNowResponse<unknown>, country: string) {
  if (payload.error || payload.data == null) {
    return []
  }

  const normalizedCountry = normalize(country)
  const entries = Array.isArray(payload.data) ? payload.data : [payload.data]
  for (const entry of entries as CountriesNowCountryEntry[]) {
    const entryCountry = entry.name?.trim() || entry.country?.trim() || ''
    if (!entryCountry || normalize(entryCountry) !== normalizedCountry) {
      continue
    }

    return uniqueSorted(
      (entry.states ?? [])
        .map((item) => item.name?.trim() || item.state_name?.trim() || '')
        .filter(Boolean),
    )
  }

  return []
}

async function fetchStatesByCountry(country: string) {
  const queryValue = encodeURIComponent(country)
  const urls = [
    `${COUNTRIES_NOW_BASE_URL}/states/q?country=${queryValue}`,
    `${COUNTRIES_NOW_BASE_URL}/states?country=${queryValue}`,
    `${COUNTRIES_NOW_BASE_URL}/states/?country=${queryValue}`,
  ]

  for (const url of urls) {
    const payload = await fetchCountriesNowJson<unknown>(url)
    if (!payload) {
      continue
    }

    const states = parseCountryStateResult(payload, country)
    if (states.length > 0) {
      return states
    }
  }

  return [] as string[]
}

function parseCityPayload(payload: CountriesNowResponse<unknown>) {
  if (payload.error || !Array.isArray(payload.data)) {
    return []
  }

  return uniqueSorted(
    (payload.data as Array<string | { city?: string; name?: string }>)
      .map((value) => {
        if (typeof value === 'string') {
          return value.trim()
        }
        return value.city?.trim() || value.name?.trim() || ''
      })
      .filter(Boolean),
  )
}

async function fetchCitiesByCountryState(country: string, state: string) {
  const cacheKey = `${normalize(country)}::${normalize(state)}`
  const cached = cityCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CITY_CACHE_TTL_MS) {
    return cached.value
  }

  const params = new URLSearchParams({ country, state })
  const urls = [
    `${COUNTRIES_NOW_BASE_URL}/state/cities/q?${params.toString()}`,
    `${COUNTRIES_NOW_BASE_URL}/state/cities?${params.toString()}`,
  ]

  for (const url of urls) {
    const payload = await fetchCountriesNowJson<unknown>(url)
    if (!payload) {
      continue
    }

    const cities = parseCityPayload(payload)
    if (cities.length > 0) {
      cityCache.set(cacheKey, { value: cities, cachedAt: Date.now() })
      return cities
    }
  }

  cityCache.set(cacheKey, { value: [], cachedAt: Date.now() })
  return [] as string[]
}

export async function GET(request: NextRequest) {
  const level = levelSchema.safeParse(request.nextUrl.searchParams.get('level'))
  const query = querySchema.safeParse(request.nextUrl.searchParams.get('query') ?? undefined)
  const country = countrySchema.safeParse(request.nextUrl.searchParams.get('country') ?? undefined)
  const state = stateSchema.safeParse(request.nextUrl.searchParams.get('state') ?? undefined)

  if (!level.success || !query.success || !country.success || !state.success) {
    return NextResponse.json({ error: 'Invalid location query' }, { status: 400 })
  }

  const queryValue = query.data
  const selectedCountry = country.data ?? ''
  const selectedState = state.data ?? ''

  if (level.data === 'state' && !selectedCountry) {
    return NextResponse.json({ error: 'Country is required for states' }, { status: 400 })
  }

  if (level.data === 'city' && (!selectedCountry || !selectedState)) {
    return NextResponse.json({ error: 'Country and state are required for cities' }, { status: 400 })
  }

  const normalizedQuery = queryValue ? normalize(queryValue) : ''
  const filterByQuery = (value: string) =>
    normalizedQuery ? normalize(value).includes(normalizedQuery) : true

  try {
    const catalog = await getCountryStateCatalog()

    if (level.data === 'country') {
      const countries = catalog?.countries.length ? catalog.countries : getIntlCountries()
      const options = uniqueSorted(countries.filter(filterByQuery))
      return NextResponse.json({ options: options.slice(0, 250) })
    }

    const normalizedCountry = normalize(selectedCountry)
    const resolvedCountry =
      catalog?.countryByNormalized.get(normalizedCountry) ?? selectedCountry

    if (level.data === 'state') {
      let states = catalog?.statesByCountry.get(normalizedCountry) ?? []
      if (states.length === 0) {
        states = await fetchStatesByCountry(resolvedCountry)
      }

      const options = uniqueSorted(states.filter(filterByQuery))
      return NextResponse.json({ options: options.slice(0, 250) })
    }

    const knownStates = catalog?.statesByCountry.get(normalizedCountry) ?? []
    const resolvedState =
      knownStates.find((value) => normalize(value) === normalize(selectedState)) ??
      selectedState

    const cities = await fetchCitiesByCountryState(resolvedCountry, resolvedState)
    const options = uniqueSorted(cities.filter(filterByQuery))
    return NextResponse.json({ options: options.slice(0, 250) })
  } catch (error) {
    console.error('CountriesNow location lookup failed:', error)
    if (level.data === 'country') {
      const options = uniqueSorted(getIntlCountries().filter(filterByQuery))
      return NextResponse.json({ options: options.slice(0, 250) })
    }
    return NextResponse.json({ options: [] })
  }
}

'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface LocationHierarchyFieldsProps {
  country: string
  state: string
  city: string
  onCountryChange: (value: string) => void
  onStateChange: (value: string) => void
  onCityChange: (value: string) => void
  required?: boolean
}

type Level = 'country' | 'state' | 'city'

async function fetchOptions(level: Level, country?: string, state?: string) {
  const query = new URLSearchParams({
    level,
    ...(country ? { country } : {}),
    ...(state ? { state } : {}),
  })
  const response = await fetch(`/api/location/options?${query.toString()}`)
  if (!response.ok) {
    return [] as string[]
  }
  const payload = (await response.json()) as { options?: string[] }
  return payload.options ?? []
}

export function LocationHierarchyFields({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  required = false,
}: LocationHierarchyFieldsProps) {
  const [countries, setCountries] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true)
      setCountries(await fetchOptions('country'))
      setLoadingCountries(false)
    }
    void loadCountries()
  }, [])

  useEffect(() => {
    if (!country) {
      setStates([])
      return
    }

    const loadStates = async () => {
      setLoadingStates(true)
      setStates(await fetchOptions('state', country))
      setLoadingStates(false)
    }
    void loadStates()
  }, [country])

  useEffect(() => {
    if (!country || !state) {
      setCities([])
      return
    }

    const loadCities = async () => {
      setLoadingCities(true)
      setCities(await fetchOptions('city', country, state))
      setLoadingCities(false)
    }
    void loadCities()
  }, [country, state])

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="country">Country{required ? ' *' : ''}</Label>
        <select
          id="country"
          value={country}
          required={required}
          onChange={(event) => {
            const value = event.target.value
            onCountryChange(value)
            onStateChange('')
            onCityChange('')
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{loadingCountries ? 'Loading countries...' : 'Select country'}</option>
          {countries.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {!loadingCountries && countries.length === 0 ? (
          <Input
            placeholder="Type country manually"
            value={country}
            onChange={(event) => {
              onCountryChange(event.target.value)
              onStateChange('')
              onCityChange('')
            }}
            required={required}
          />
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="state">State{required ? ' *' : ''}</Label>
        <select
          id="state"
          value={state}
          required={required && states.length > 0}
          disabled={!country}
          onChange={(event) => {
            const value = event.target.value
            onStateChange(value)
            onCityChange('')
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
        >
          <option value="">
            {!country
              ? 'Select country first'
              : loadingStates
                ? 'Loading states...'
                : 'Select state'}
          </option>
          {states.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {country && !loadingStates && states.length === 0 ? (
          <Input
            placeholder="Type state manually"
            value={state}
            onChange={(event) => {
              onStateChange(event.target.value)
              onCityChange('')
            }}
            required={required}
          />
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="city">City{required ? ' *' : ''}</Label>
        <select
          id="city"
          value={city}
          required={required && cities.length > 0}
          disabled={!country || !state}
          onChange={(event) => onCityChange(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
        >
          <option value="">
            {!country || !state
              ? 'Select country and state first'
              : loadingCities
                ? 'Loading cities...'
                : 'Select city'}
          </option>
          {cities.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {country && state && !loadingCities && cities.length === 0 ? (
          <Input
            placeholder="Type city manually"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            required={required}
          />
        ) : null}
      </div>
    </>
  )
}

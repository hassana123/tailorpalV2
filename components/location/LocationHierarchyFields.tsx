'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
const EMPTY_VALUE = '__empty__'

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
        {countries.length > 0 ? (
          <Select
            value={country || EMPTY_VALUE}
            onValueChange={(value) => {
              const nextCountry = value === EMPTY_VALUE ? '' : value
              onCountryChange(nextCountry)
              onStateChange('')
              onCityChange('')
            }}
            disabled={loadingCountries}
          >
            <SelectTrigger id="country" className="h-10">
              <SelectValue
                placeholder={loadingCountries ? 'Loading countries...' : 'Select country'}
              />
            </SelectTrigger>
            <SelectContent className="z-[80] max-h-72">
              <SelectItem value={EMPTY_VALUE}>Select country</SelectItem>
              {countries.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : !loadingCountries ? (
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
        ) : (
          <Input value="Loading countries..." disabled />
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="state">State{required ? ' *' : ''}</Label>
        {country && states.length > 0 ? (
          <Select
            value={state || EMPTY_VALUE}
            onValueChange={(value) => {
              const nextState = value === EMPTY_VALUE ? '' : value
              onStateChange(nextState)
              onCityChange('')
            }}
            disabled={loadingStates}
          >
            <SelectTrigger id="state" className="h-10">
              <SelectValue placeholder={loadingStates ? 'Loading states...' : 'Select state'} />
            </SelectTrigger>
            <SelectContent className="z-[80] max-h-72">
              <SelectItem value={EMPTY_VALUE}>Select state</SelectItem>
              {states.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : country && !loadingStates ? (
          <Input
            placeholder="Type state manually"
            value={state}
            onChange={(event) => {
              onStateChange(event.target.value)
              onCityChange('')
            }}
            required={required}
          />
        ) : (
          <Input
            value={!country ? 'Select country first' : 'Loading states...'}
            disabled
          />
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="city">City{required ? ' *' : ''}</Label>
        {country && state && cities.length > 0 ? (
          <Select
            value={city || EMPTY_VALUE}
            onValueChange={(value) => onCityChange(value === EMPTY_VALUE ? '' : value)}
            disabled={loadingCities}
          >
            <SelectTrigger id="city" className="h-10">
              <SelectValue placeholder={loadingCities ? 'Loading cities...' : 'Select city'} />
            </SelectTrigger>
            <SelectContent className="z-[80] max-h-72">
              <SelectItem value={EMPTY_VALUE}>Select city</SelectItem>
              {cities.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : country && state && !loadingCities ? (
          <Input
            placeholder="Type city manually"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            required={required}
          />
        ) : (
          <Input
            value={!country || !state ? 'Select country and state first' : 'Loading cities...'}
            disabled
          />
        )}
      </div>
    </>
  )
}

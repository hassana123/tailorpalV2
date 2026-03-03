'use client'

import { Input } from '@/components/ui/input'
import { useEffect, useMemo, useState } from 'react'

export interface LocationSuggestion {
  displayName: string
  address: string
  city: string
  state: string
  country: string
  lat: number
  lon: number
}

interface LocationAutocompleteProps {
  id?: string
  name?: string
  value: string
  onValueChange: (value: string) => void
  onSelect: (suggestion: LocationSuggestion) => void
  placeholder?: string
  disabled?: boolean
  country?: string
  state?: string
  city?: string
}

const MIN_QUERY_LENGTH = 3

export function LocationAutocomplete({
  id,
  name,
  value,
  onValueChange,
  onSelect,
  placeholder = 'Search location',
  disabled,
  country,
  state,
  city,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [lockedSelection, setLockedSelection] = useState<string | null>(null)

  const normalizedValue = value.trim()
  const isSelectionLocked =
    lockedSelection !== null && normalizedValue === lockedSelection

  const shouldSearch = useMemo(
    () => normalizedValue.length >= MIN_QUERY_LENGTH && !isSelectionLocked,
    [normalizedValue, isSelectionLocked],
  )

  useEffect(() => {
    if (!normalizedValue) {
      setLockedSelection(null)
      return
    }

    if (lockedSelection && normalizedValue !== lockedSelection) {
      setLockedSelection(null)
    }
  }, [normalizedValue, lockedSelection])

  useEffect(() => {
    if (!shouldSearch) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/location/search?${new URLSearchParams({
            q: value.trim(),
            ...(country ? { country } : {}),
            ...(state ? { state } : {}),
            ...(city ? { city } : {}),
          }).toString()}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          setSuggestions([])
          setOpen(false)
          return
        }

        const payload = (await response.json()) as {
          suggestions?: LocationSuggestion[]
        }
        const nextSuggestions = payload.suggestions ?? []
        setSuggestions(nextSuggestions)
        setOpen(nextSuggestions.length > 0)
      } catch {
        setSuggestions([])
        setOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [value, shouldSearch, country, state, city])

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value
          if (lockedSelection && nextValue.trim() !== lockedSelection) {
            setLockedSelection(null)
          }
          onValueChange(nextValue)
        }}
        onFocus={() => {
          if (suggestions.length > 0 && !isSelectionLocked) {
            setOpen(true)
          }
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
        }}
      />

      {isLoading && (
        <p className="mt-1 text-xs text-muted-foreground">Looking up addresses...</p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-[90] mt-2 w-full max-h-72 overflow-y-auto rounded-md border bg-background shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.displayName}-${suggestion.lat}-${suggestion.lon}`}
              type="button"
              className="w-full border-b px-3 py-2 text-left text-sm hover:bg-muted last:border-b-0"
              onMouseDown={() => {
                // Fill the input with the exact selected suggestion text.
                onValueChange(suggestion.displayName)
                setLockedSelection(suggestion.displayName.trim())
                onSelect(suggestion)
                setOpen(false)
              }}
            >
              {suggestion.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

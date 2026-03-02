'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STANDARD_MEASUREMENTS } from '@/lib/constants/measurements'
import {
  extractMeasurementMaps,
  formatMeasurementLabel,
  sortMeasurementEntries,
} from '@/lib/utils/measurement-records'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, X, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const MEASUREMENT_CATEGORIES = Array.from(new Set(STANDARD_MEASUREMENTS.map((m) => m.category)))

interface Measurement {
  id: string
  shop_id: string
  customer_id: string
  notes?: string | null
  status: 'pending' | 'completed'
  created_at: string
  updated_at?: string
  standard_measurements?: Record<string, unknown> | null
  custom_measurements?: Record<string, unknown> | null
  customers?: { first_name: string; last_name: string } | null
  [key: string]: unknown
}

interface CustomerOption {
  id: string
  first_name: string
  last_name: string
}

export default function MeasurementsPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const supabase = createClient()

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedMeasurements, setSelectedMeasurements] = useState<Record<string, string>>({})
  const [customMeasurements, setCustomMeasurements] = useState<{ name: string; value: string }[]>([])
  const [newCustomName, setNewCustomName] = useState('')
  const [notes, setNotes] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [shopId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [measurementsResponse, customersResponse] = await Promise.all([
        supabase
          .from('measurements')
          .select('*, customers(first_name, last_name)')
          .eq('shop_id', shopId)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('id, first_name, last_name')
          .eq('shop_id', shopId)
          .order('first_name', { ascending: true }),
      ])

      if (measurementsResponse.error) throw measurementsResponse.error
      if (customersResponse.error) throw customersResponse.error

      const normalizedMeasurements = (measurementsResponse.data ?? []).map((measurement: any) => {
        const relation = measurement.customers as
          | Measurement['customers']
          | Array<NonNullable<Measurement['customers']>>
        const customer = Array.isArray(relation) ? relation[0] ?? null : relation
        return { ...(measurement as Measurement), customers: customer }
      })

      setMeasurements(normalizedMeasurements)
      setCustomers((customersResponse.data ?? []) as CustomerOption[])
    } catch (err) {
      console.error('Error fetching measurements:', err)
      setError('Failed to load measurements')
    } finally {
      setLoading(false)
    }
  }

  const toggleMeasurementField = (key: string) => {
    setSelectedMeasurements((prev) => {
      const next = { ...prev }
      if (key in next) {
        delete next[key]
      } else {
        next[key] = ''
      }
      return next
    })
  }

  const addCustomField = () => {
    const name = newCustomName.trim()
    if (!name) return
    if (customMeasurements.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError('A custom measurement with that name already exists')
      return
    }
    setCustomMeasurements((prev) => [...prev, { name, value: '' }])
    setNewCustomName('')
  }

  const resetForm = () => {
    setSelectedCustomerId('')
    setSelectedMeasurements({})
    setCustomMeasurements([])
    setNewCustomName('')
    setNotes('')
    setShowPicker(false)
  }

  const createMeasurement = async () => {
    if (!selectedCustomerId) {
      setError('Please choose a customer')
      return
    }

    const standardObj: Record<string, number> = {}
    for (const [key, val] of Object.entries(selectedMeasurements)) {
      const n = Number.parseFloat(val)
      if (!Number.isNaN(n) && n > 0) standardObj[key] = n
    }

    const customObj: Record<string, number> = {}
    for (const { name, value } of customMeasurements) {
      const n = Number.parseFloat(value)
      if (!Number.isNaN(n) && n > 0) customObj[name] = n
    }

    if (Object.keys(standardObj).length === 0 && Object.keys(customObj).length === 0) {
      setError('Please enter at least one measurement value')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerId: selectedCustomerId,
          standardMeasurements: standardObj,
          customMeasurements: customObj,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to record measurements')
      }

      resetForm()
      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Error creating measurement:', err)
      setError(err instanceof Error ? err.message : 'Failed to create measurement')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: Measurement['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Measurements</h1>
          <p className="text-muted-foreground mt-2">Track customer measurements</p>
        </div>
        <Button
          onClick={() => {
            if (showForm) resetForm()
            setShowForm((prev) => !prev)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Close' : 'New Measurement'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button type="button" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record Measurement</CardTitle>
            <CardDescription>
              Select a customer, choose measurements from the list, and optionally add custom ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium">Customer *</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowPicker((p) => !p)}
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Choose from standard measurements
                  {Object.keys(selectedMeasurements).length > 0 && (
                    <Badge variant="secondary">{Object.keys(selectedMeasurements).length} selected</Badge>
                  )}
                </span>
                {showPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showPicker && (
                <div className="border rounded-lg p-4 mt-2 space-y-3 bg-muted/20">
                  {MEASUREMENT_CATEGORIES.map((category) => {
                    const items = STANDARD_MEASUREMENTS.filter((m) => m.category === category)
                    const isExpanded = expandedCategories[category] !== false
                    return (
                      <div key={category}>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full text-sm font-semibold py-1 hover:text-primary"
                          onClick={() =>
                            setExpandedCategories((prev) => ({ ...prev, [category]: !isExpanded }))
                          }
                        >
                          {category}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {isExpanded && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {items.map((m) => {
                              const isSelected = m.key in selectedMeasurements
                              return (
                                <button
                                  key={m.key}
                                  type="button"
                                  onClick={() => toggleMeasurementField(m.key)}
                                  className={`text-xs px-3 py-2 rounded-md border text-left transition-colors ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background hover:bg-muted border-border'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {Object.keys(selectedMeasurements).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Enter values (cm)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(selectedMeasurements).map((key) => {
                    const def = STANDARD_MEASUREMENTS.find((m) => m.key === key)
                    return (
                      <div key={key} className="relative">
                        <label className="text-xs font-medium text-muted-foreground">
                          {def?.label || key}
                        </label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            placeholder="0"
                            value={selectedMeasurements[key]}
                            onChange={(e) =>
                              setSelectedMeasurements((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            className="pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => toggleMeasurementField(key)}
                            className="absolute right-2 top-6 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Custom Measurements</p>
              <p className="text-xs text-muted-foreground mb-2">
                Add any measurement not in the standard list above.
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="e.g. Torso Length..."
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                />
                <Button type="button" variant="outline" onClick={addCustomField} disabled={!newCustomName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {customMeasurements.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {customMeasurements.map((cm, idx) => (
                    <div key={idx} className="relative">
                      <label className="text-xs font-medium text-muted-foreground">{cm.name}</label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          placeholder="0"
                          value={cm.value}
                          onChange={(e) =>
                            setCustomMeasurements((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, value: e.target.value } : item,
                              ),
                            )
                          }
                          className="pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomMeasurements((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-6 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                className="mt-1"
                placeholder="Any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={createMeasurement} disabled={creating} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {creating ? 'Saving...' : 'Save Measurement'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Measurements</CardTitle>
          <CardDescription>Total: {measurements.length} measurements</CardDescription>
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No measurements yet.</p>
          ) : (
            <div className="space-y-4">
              {measurements.map((measurement) => {
                const entries = sortMeasurementEntries(
                  Object.entries(extractMeasurementMaps(measurement).all),
                )

                return (
                  <div key={measurement.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">
                        {measurement.customers?.first_name} {measurement.customers?.last_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(measurement.created_at).toLocaleDateString()}
                        </span>
                        <Badge className={getStatusColor(measurement.status)}>{measurement.status}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {entries.length > 0 ? (
                        entries.map(([key, value]) => (
                          <div key={key} className="bg-muted/40 rounded px-2 py-1">
                            <span className="text-xs text-muted-foreground block">
                              {formatMeasurementLabel(key)}
                            </span>
                            <span className="font-medium">{value} cm</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No measurement values recorded.</p>
                      )}
                    </div>
                    {measurement.notes && (
                      <p className="text-xs text-muted-foreground mt-2">Notes: {measurement.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

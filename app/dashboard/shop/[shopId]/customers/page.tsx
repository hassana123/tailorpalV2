'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Trash2,
  Eye,
  Edit2,
  Plus,
  X,
  Save,
  Ruler,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  shop_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface Measurement {
  id: string
  customer_id: string
  created_at: string
  notes: string | null
  status: string
  standard_measurements: Record<string, number>
  custom_measurements: Record<string, number>
}

// ─── Comprehensive tailor measurement catalogue ───────────────────────────────

export const STANDARD_MEASUREMENTS: { key: string; label: string; category: string }[] = [
  // Upper body
  { key: 'chest', label: 'Chest / Bust', category: 'Upper Body' },
  { key: 'under_bust', label: 'Under Bust', category: 'Upper Body' },
  { key: 'waist', label: 'Waist', category: 'Upper Body' },
  { key: 'hip', label: 'Hip', category: 'Lower Body' },
  { key: 'neck', label: 'Neck', category: 'Upper Body' },
  { key: 'shoulder_width', label: 'Shoulder Width', category: 'Upper Body' },
  { key: 'across_back', label: 'Across Back', category: 'Upper Body' },
  { key: 'across_chest', label: 'Across Chest', category: 'Upper Body' },
  { key: 'back_length', label: 'Back Length', category: 'Upper Body' },
  { key: 'front_length', label: 'Front Length', category: 'Upper Body' },
  { key: 'bust_point_to_bust_point', label: 'Bust Point to Bust Point', category: 'Upper Body' },
  { key: 'bust_depth', label: 'Bust Depth', category: 'Upper Body' },
  // Arms
  { key: 'sleeve_length', label: 'Sleeve Length', category: 'Arms' },
  { key: 'sleeve_length_short', label: 'Short Sleeve Length', category: 'Arms' },
  { key: 'upper_arm', label: 'Upper Arm / Bicep', category: 'Arms' },
  { key: 'elbow', label: 'Elbow', category: 'Arms' },
  { key: 'wrist', label: 'Wrist', category: 'Arms' },
  { key: 'armhole_depth', label: 'Armhole Depth', category: 'Arms' },
  // Lower body
  { key: 'inseam', label: 'Inseam', category: 'Lower Body' },
  { key: 'outseam', label: 'Outseam', category: 'Lower Body' },
  { key: 'thigh', label: 'Thigh', category: 'Lower Body' },
  { key: 'knee', label: 'Knee', category: 'Lower Body' },
  { key: 'calf', label: 'Calf', category: 'Lower Body' },
  { key: 'ankle', label: 'Ankle', category: 'Lower Body' },
  { key: 'rise', label: 'Rise (Crotch Depth)', category: 'Lower Body' },
  { key: 'trouser_length', label: 'Trouser Length', category: 'Lower Body' },
  { key: 'skirt_length', label: 'Skirt Length', category: 'Lower Body' },
  { key: 'dress_length', label: 'Dress Length', category: 'Lower Body' },
  // Full body / height
  { key: 'height', label: 'Height', category: 'Full Body' },
  { key: 'full_length', label: 'Full Length (Shoulder to Floor)', category: 'Full Body' },
  { key: 'waist_to_floor', label: 'Waist to Floor', category: 'Full Body' },
  { key: 'waist_to_knee', label: 'Waist to Knee', category: 'Full Body' },
  { key: 'nape_to_waist', label: 'Nape to Waist', category: 'Full Body' },
  { key: 'shoulder_to_waist', label: 'Shoulder to Waist', category: 'Full Body' },
  // Head / accessories
  { key: 'head_circumference', label: 'Head Circumference', category: 'Head & Accessories' },
  { key: 'cap_height', label: 'Cap Height', category: 'Head & Accessories' },
]

const MEASUREMENT_CATEGORIES = Array.from(new Set(STANDARD_MEASUREMENTS.map((m) => m.category)))

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const supabase = createClient()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Panels
  const [view, setView] = useState<'list' | 'add' | 'detail' | 'edit' | 'addMeasurement'>('list')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerMeasurements, setCustomerMeasurements] = useState<Measurement[]>([])
  const [loadingMeasurements, setLoadingMeasurements] = useState(false)

  // Add customer form
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    notes: '',
  })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)

  // Edit customer form
  const [editForm, setEditForm] = useState<Partial<Customer>>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Measurement form
  const [selectedMeasurements, setSelectedMeasurements] = useState<Record<string, string>>({})
  const [customMeasurements, setCustomMeasurements] = useState<{ name: string; value: string }[]>([])
  const [newCustomName, setNewCustomName] = useState('')
  const [measurementNotes, setMeasurementNotes] = useState('')
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false)
  const [showMeasurementPicker, setShowMeasurementPicker] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Search
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [shopId])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setCustomers(data || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerMeasurements = useCallback(
    async (customerId: string) => {
      try {
        setLoadingMeasurements(true)
        const { data, error: fetchError } = await supabase
          .from('measurements')
          .select('*')
          .eq('customer_id', customerId)
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        // Normalise: map old flat columns → standard_measurements object
        const normalised: Measurement[] = (data || []).map((row: Record<string, unknown>) => {
          const std: Record<string, number> = {}
          const legacyKeys = [
            'chest', 'waist', 'hip', 'shoulder_width', 'sleeve_length',
            'inseam', 'neck',
          ]
          for (const k of legacyKeys) {
            if (row[k] != null) std[k] = row[k] as number
          }
          // Merge with stored standard_measurements if present
          const storedStd = (row.standard_measurements as Record<string, number>) || {}
          const storedCustom = (row.custom_measurements as Record<string, number>) || {}
          return {
            id: row.id as string,
            customer_id: row.customer_id as string,
            created_at: row.created_at as string,
            notes: row.notes as string | null,
            status: row.status as string,
            standard_measurements: { ...std, ...storedStd },
            custom_measurements: storedCustom,
          }
        })

        setCustomerMeasurements(normalised)
      } catch (err) {
        console.error('Error fetching measurements:', err)
      } finally {
        setLoadingMeasurements(false)
      }
    },
    [shopId, supabase],
  )

  const openDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setView('detail')
    await fetchCustomerMeasurements(customer.id)
  }

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({ ...customer })
    setView('edit')
  }

  const openAddMeasurement = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSelectedMeasurements({})
    setCustomMeasurements([])
    setMeasurementNotes('')
    setShowMeasurementPicker(false)
    setView('addMeasurement')
  }

  const addCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      setError('First name and last name are required')
      return
    }
    try {
      setIsAddingCustomer(true)
      setError(null)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          email: newCustomer.email || undefined,
          phone: newCustomer.phone || undefined,
          address: newCustomer.address || undefined,
          city: newCustomer.city || undefined,
          country: newCustomer.country || undefined,
          notes: newCustomer.notes || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to add customer')
      }

      setNewCustomer({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', country: '', notes: '' })
      setSuccessMsg('Customer added successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
      setView('list')
      await fetchCustomers()
    } catch (err) {
      console.error('Error adding customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to add customer')
    } finally {
      setIsAddingCustomer(false)
    }
  }

  const saveEdit = async () => {
    if (!selectedCustomer || !editForm.first_name || !editForm.last_name) {
      setError('First name and last name are required')
      return
    }
    try {
      setIsSavingEdit(true)
      setError(null)
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          city: editForm.city || null,
          country: editForm.country || null,
          notes: editForm.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCustomer.id)

      if (updateError) throw updateError

      setSuccessMsg('Customer updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
      await fetchCustomers()
      const updated = { ...selectedCustomer, ...editForm } as Customer
      setSelectedCustomer(updated)
      setView('detail')
      await fetchCustomerMeasurements(selectedCustomer.id)
    } catch (err) {
      console.error('Error updating customer:', err)
      setError('Failed to update customer')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return
    try {
      const { error: deleteError } = await supabase.from('customers').delete().eq('id', customerId)
      if (deleteError) throw deleteError
      setView('list')
      setSelectedCustomer(null)
      await fetchCustomers()
    } catch (err) {
      console.error('Error deleting customer:', err)
      setError('Failed to delete customer')
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

  const addCustomMeasurementField = () => {
    const name = newCustomName.trim()
    if (!name) return
    if (customMeasurements.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError('A custom measurement with that name already exists')
      return
    }
    setCustomMeasurements((prev) => [...prev, { name, value: '' }])
    setNewCustomName('')
  }

  const saveMeasurement = async () => {
    if (!selectedCustomer) return

    const standardObj: Record<string, number> = {}
    for (const [key, val] of Object.entries(selectedMeasurements)) {
      const n = parseFloat(val)
      if (!isNaN(n) && n > 0) standardObj[key] = n
    }

    const customObj: Record<string, number> = {}
    for (const { name, value } of customMeasurements) {
      const n = parseFloat(value)
      if (!isNaN(n) && n > 0) customObj[name] = n
    }

    if (Object.keys(standardObj).length === 0 && Object.keys(customObj).length === 0) {
      setError('Please enter at least one measurement value')
      return
    }

    try {
      setIsSavingMeasurement(true)
      setError(null)

      // Build legacy columns for backward compat
      const legacyFields: Record<string, number | null> = {
        chest: standardObj.chest ?? null,
        waist: standardObj.waist ?? null,
        hip: standardObj.hip ?? null,
        shoulder_width: standardObj.shoulder_width ?? null,
        sleeve_length: standardObj.sleeve_length ?? null,
        inseam: standardObj.inseam ?? null,
        neck: standardObj.neck ?? null,
      }

      const { error: insertError } = await supabase.from('measurements').insert([
        {
          shop_id: shopId,
          customer_id: selectedCustomer.id,
          ...legacyFields,
          notes: measurementNotes || null,
          status: 'completed',
        },
      ])

      if (insertError) throw insertError

      setSuccessMsg('Measurements saved successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
      setView('detail')
      await fetchCustomerMeasurements(selectedCustomer.id)
    } catch (err) {
      console.error('Error saving measurement:', err)
      setError('Failed to save measurements')
    } finally {
      setIsSavingMeasurement(false)
    }
  }

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Global alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </AlertDescription>
        </Alert>
      )}
      {successMsg && (
        <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground mt-1">Manage your shop customers</p>
            </div>
            <Button onClick={() => setView('add')}>
              <Plus className="h-4 w-4 mr-2" /> Add Customer
            </Button>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">
                  {search ? 'No customers match your search.' : 'No customers yet. Add your first customer.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {customer.first_name} {customer.last_name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {customer.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {customer.email}
                            </span>
                          )}
                          {customer.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {customer.phone}
                            </span>
                          )}
                          {(customer.city || customer.country) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {[customer.city, customer.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => openDetail(customer)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(customer)}>
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCustomer(customer.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── ADD CUSTOMER VIEW ── */}
      {view === 'add' && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <h1 className="text-2xl font-bold">Add New Customer</h1>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    className="mt-1"
                    placeholder="First name"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    className="mt-1"
                    placeholder="Last name"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  className="mt-1"
                  placeholder="customer@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    className="mt-1"
                    placeholder="+234 800 000 0000"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    className="mt-1"
                    placeholder="Street address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    className="mt-1"
                    placeholder="City"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    className="mt-1"
                    placeholder="Country"
                    value={newCustomer.country}
                    onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  className="mt-1"
                  placeholder="Any additional notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={addCustomer} disabled={isAddingCustomer} className="flex-1">
                  {isAddingCustomer ? 'Adding…' : 'Add Customer'}
                </Button>
                <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {view === 'detail' && selectedCustomer && (
        <>
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setView('list')}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(selectedCustomer)}>
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button size="sm" onClick={() => openAddMeasurement(selectedCustomer)}>
                <Ruler className="h-4 w-4 mr-1" /> Add Measurements
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteCustomer(selectedCustomer.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>

          {/* Customer info card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={selectedCustomer.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={selectedCustomer.phone} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={selectedCustomer.address} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="City" value={selectedCustomer.city} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Country" value={selectedCustomer.country} />
                {selectedCustomer.notes && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{selectedCustomer.notes}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Measurements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" /> Measurements
                </CardTitle>
                <CardDescription>{customerMeasurements.length} record{customerMeasurements.length !== 1 ? 's' : ''}</CardDescription>
              </div>
              <Button size="sm" onClick={() => openAddMeasurement(selectedCustomer)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {loadingMeasurements ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : customerMeasurements.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No measurements recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {customerMeasurements.map((m) => (
                    <MeasurementCard key={m.id} measurement={m} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── EDIT VIEW ── */}
      {view === 'edit' && selectedCustomer && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('detail')}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Customer</h1>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    className="mt-1"
                    value={editForm.first_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    className="mt-1"
                    value={editForm.last_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  className="mt-1"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    className="mt-1"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    className="mt-1"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    className="mt-1"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    className="mt-1"
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  className="mt-1"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={saveEdit} disabled={isSavingEdit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setView('detail')}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── ADD MEASUREMENT VIEW ── */}
      {view === 'addMeasurement' && selectedCustomer && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('detail')}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">
              Add Measurements — {selectedCustomer.first_name} {selectedCustomer.last_name}
            </h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Measurements</CardTitle>
              <CardDescription>
                Choose from the standard list or add your own custom measurement names.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Picker toggle */}
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowMeasurementPicker((p) => !p)}
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Choose from standard measurements
                  {Object.keys(selectedMeasurements).length > 0 && (
                    <Badge variant="secondary">{Object.keys(selectedMeasurements).length} selected</Badge>
                  )}
                </span>
                {showMeasurementPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showMeasurementPicker && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  {MEASUREMENT_CATEGORIES.map((category) => {
                    const items = STANDARD_MEASUREMENTS.filter((m) => m.category === category)
                    const isExpanded = expandedCategories[category] !== false // default open
                    return (
                      <div key={category}>
                        <button
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

              {/* Selected standard measurement inputs */}
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

              {/* Custom measurements */}
              <div>
                <p className="text-sm font-medium mb-2">Custom Measurements</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Add any measurement not in the standard list above.
                </p>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g. Torso Length, Bust Height…"
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomMeasurementField()}
                  />
                  <Button variant="outline" onClick={addCustomMeasurementField} disabled={!newCustomName.trim()}>
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
                                prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item)),
                              )
                            }
                            className="pr-8"
                          />
                          <button
                            onClick={() =>
                              setCustomMeasurements((prev) => prev.filter((_, i) => i !== idx))
                            }
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

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  className="mt-1"
                  placeholder="Any additional notes about these measurements"
                  value={measurementNotes}
                  onChange={(e) => setMeasurementNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={saveMeasurement} disabled={isSavingMeasurement} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingMeasurement ? 'Saving…' : 'Save Measurements'}
                </Button>
                <Button variant="outline" onClick={() => setView('detail')}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <span className="text-muted-foreground text-xs">{label}: </span>
        <span className="text-sm">{value}</span>
      </div>
    </div>
  )
}

function MeasurementCard({ measurement }: { measurement: Measurement }) {
  const allEntries = [
    ...Object.entries(measurement.standard_measurements).map(([k, v]) => ({
      label: STANDARD_MEASUREMENTS.find((m) => m.key === k)?.label || k,
      value: v,
    })),
    ...Object.entries(measurement.custom_measurements).map(([k, v]) => ({
      label: k,
      value: v,
    })),
  ]

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">
          {new Date(measurement.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <Badge
          className={
            measurement.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }
        >
          {measurement.status}
        </Badge>
      </div>
      {allEntries.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {allEntries.map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded px-2 py-1">
              <span className="text-xs text-muted-foreground block">{label}</span>
              <span className="font-medium">{value} cm</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No measurement values recorded.</p>
      )}
      {measurement.notes && (
        <p className="text-xs text-muted-foreground mt-2">Notes: {measurement.notes}</p>
      )}
    </div>
  )
}

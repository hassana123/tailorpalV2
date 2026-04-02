'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { TableAction } from '@/components/dashboard/shared/table-actions'
import { STANDARD_MEASUREMENTS } from '@/lib/constants/measurements'
import {
  extractMeasurementMaps,
  formatMeasurementLabel,
  sanitizeMeasurementMap,
  sortMeasurementEntries,
} from '@/lib/utils/measurement-records'
import {
  Plus,
  Ruler,
  Users,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  last_name: string | null
}

type EditableMeasurement = {
  id: string
  customerName: string
  status: Measurement['status']
  notes: string
  standard: Record<string, string>
  custom: Record<string, string>
}

const MEASUREMENT_CATEGORIES = Array.from(
  new Set(STANDARD_MEASUREMENTS.map((m) => m.category))
)

type QuickCustomerForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const initialQuickCustomerForm: QuickCustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
}

const normalizeOptionalString = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const sortCustomerOptions = (items: CustomerOption[]) =>
  [...items].sort((a, b) =>
    `${a.first_name} ${a.last_name ?? ''}`.localeCompare(`${b.first_name} ${b.last_name ?? ''}`)
  )

const formatCustomerName = (customer: Pick<CustomerOption, 'first_name' | 'last_name'>) =>
  [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim()

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

// ─── Measurement Picker (shared by add form) ──────────────────────────────────

function MeasurementPicker({
  selectedMeasurements,
  onToggle,
}: {
  selectedMeasurements: Record<string, string>
  onToggle: (key: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  return (
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
        <div className="border border-brand-border rounded-xl p-4 mt-2 space-y-3 bg-brand-cream/30">
          {MEASUREMENT_CATEGORIES.map((category) => {
            const items = STANDARD_MEASUREMENTS.filter((m) => m.category === category)
            const isExpanded = expandedCategories[category] !== false
            return (
              <div key={category}>
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-sm font-semibold py-1 hover:text-brand-gold transition-colors"
                  onClick={() =>
                    setExpandedCategories((prev) => ({ ...prev, [category]: !isExpanded }))
                  }
                >
                  {category}
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {items.map((m) => {
                      const isSelected = m.key in selectedMeasurements
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => onToggle(m.key)}
                          className={cn(
                            'text-xs px-3 py-2 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'bg-brand-ink text-white border-brand-ink'
                              : 'bg-white hover:bg-brand-cream border-brand-border'
                          )}
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
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MeasurementsPageContent() {
  const params = useParams()
  const shopId = params.shopId as string
  const supabase = createClient()

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null)
  const [editableMeasurement, setEditableMeasurement] = useState<EditableMeasurement | null>(null)

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedMeasurements, setSelectedMeasurements] = useState<Record<string, string>>({})
  const [customMeasurements, setCustomMeasurements] = useState<{ name: string; value: string }[]>([])
  const [newCustomName, setNewCustomName] = useState('')
  const [notes, setNotes] = useState('')
  const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false)
  const [quickCustomerForm, setQuickCustomerForm] = useState<QuickCustomerForm>(initialQuickCustomerForm)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

  useEffect(() => { fetchData() }, [shopId])
  useEffect(() => {
    if (!addModalOpen) {
      setShowQuickCustomerForm(false)
      setQuickCustomerForm(initialQuickCustomerForm)
      return
    }

    if (customers.length === 0) {
      setShowQuickCustomerForm(true)
    }
  }, [addModalOpen, customers.length])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mRes, cRes] = await Promise.all([
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
      if (mRes.error) throw mRes.error
      if (cRes.error) throw cRes.error

      const normalized = (mRes.data ?? []).map((raw) => {
        const measurement = raw as Measurement & {
          customers: Measurement['customers'] | Measurement['customers'][]
        }
        const rel = measurement.customers
        const customer = Array.isArray(rel) ? rel[0] ?? null : rel
        return { ...measurement, customers: customer } as Measurement
      })
      setMeasurements(normalized)
      setCustomers(sortCustomerOptions((cRes.data ?? []) as CustomerOption[]))
    } catch {
      toast.error('Failed to load measurements')
    } finally {
      setLoading(false)
    }
  }

  const toggleMeasurementField = (key: string) => {
    setSelectedMeasurements((prev) => {
      const next = { ...prev }
      if (key in next) delete next[key]
      else next[key] = ''
      return next
    })
  }

  const addCustomField = () => {
    const name = newCustomName.trim()
    if (!name) return
    if (customMeasurements.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A custom measurement with that name already exists')
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
    setShowQuickCustomerForm(false)
    setQuickCustomerForm(initialQuickCustomerForm)
  }

  const handleQuickCustomerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleQuickAddCustomer()
    }
  }

  const handleQuickAddCustomer = async () => {
    const firstName = quickCustomerForm.firstName.trim()

    if (!firstName) {
      toast.error('First name is required')
      return
    }

    try {
      setIsCreatingCustomer(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          firstName,
          lastName: normalizeOptionalString(quickCustomerForm.lastName),
          email: normalizeOptionalString(quickCustomerForm.email),
          phone: normalizeOptionalString(quickCustomerForm.phone),
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to add customer')
      }

      const createdCustomer = payload?.customer as
        | { id: string; first_name: string; last_name: string | null }
        | undefined

      if (!createdCustomer) {
        throw new Error('Customer created but no record was returned')
      }

      const nextCustomer: CustomerOption = {
        id: createdCustomer.id,
        first_name: createdCustomer.first_name,
        last_name: createdCustomer.last_name ?? null,
      }

      setCustomers((prev) =>
        sortCustomerOptions([...prev.filter((item) => item.id !== nextCustomer.id), nextCustomer])
      )
      setSelectedCustomerId(nextCustomer.id)
      setShowQuickCustomerForm(false)
      setQuickCustomerForm(initialQuickCustomerForm)
      toast.success(`${formatCustomerName(nextCustomer)} added. Continue with measurements.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add customer')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCustomerId) {
      toast.error('Please choose a customer')
      return
    }
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
      toast.error('Please enter at least one measurement value')
      return
    }
    try {
      setIsSubmitting(true)
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
        throw new Error(payload.error || 'Failed to save measurements')
      }
      toast.success('Measurements saved successfully!')
      resetForm()
      setAddModalOpen(false)
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save measurements')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openViewModal = (measurement: Measurement) => {
    setSelectedMeasurement(measurement)
    setViewModalOpen(true)
  }

  const openEditModal = (measurement: Measurement) => {
    const maps = extractMeasurementMaps(measurement)
    const toStringMap = (input: Record<string, number>) =>
      Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)]))

    setEditableMeasurement({
      id: measurement.id,
      customerName: `${measurement.customers?.first_name ?? ''} ${measurement.customers?.last_name ?? ''}`.trim(),
      status: measurement.status,
      notes: measurement.notes ?? '',
      standard: toStringMap(maps.standard),
      custom: toStringMap(maps.custom),
    })
    setEditModalOpen(true)
  }

  const handleMeasurementUpdate = async () => {
    if (!editableMeasurement) return

    const standard = sanitizeMeasurementMap(editableMeasurement.standard)
    const custom = sanitizeMeasurementMap(editableMeasurement.custom)

    if (Object.keys(standard).length === 0 && Object.keys(custom).length === 0) {
      toast.error('Please enter at least one valid measurement value')
      return
    }

    try {
      setIsEditing(true)
      const { error } = await supabase
        .from('measurements')
        .update({
          standard_measurements: standard,
          custom_measurements: custom,
          notes: editableMeasurement.notes.trim() || null,
          status: editableMeasurement.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editableMeasurement.id)

      if (error) throw error

      toast.success('Measurement updated')
      setEditModalOpen(false)
      setEditableMeasurement(null)
      await fetchData()
    } catch {
      toast.error('Failed to update measurement')
    } finally {
      setIsEditing(false)
    }
  }

  // ─── Table columns ───────────────────────────────────────────────────────

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (m: Measurement) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">
              {m.customers?.first_name?.[0]}{m.customers?.last_name?.[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-brand-ink">
              {m.customers?.first_name} {m.customers?.last_name}
            </p>
            <p className="text-xs text-brand-stone">
              {new Date(m.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (m: Measurement) =>
        `${m.customers?.first_name ?? ''} ${m.customers?.last_name ?? ''}`,
    },
    {
      key: 'measurements',
      header: 'Measurements',
      cell: (m: Measurement) => {
        const entries = sortMeasurementEntries(
          Object.entries(extractMeasurementMaps(m).all)
        )
        return (
          <div className="flex flex-wrap gap-1.5">
            {entries.slice(0, 4).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[10px] bg-brand-cream border border-brand-border px-2 py-0.5 rounded-full text-brand-charcoal font-medium"
              >
                {formatMeasurementLabel(key)}: {value}cm
              </span>
            ))}
            {entries.length > 4 && (
              <span className="text-xs text-brand-stone">+{entries.length - 4} more</span>
            )}
            {entries.length === 0 && (
              <span className="text-xs text-brand-stone/60">No values recorded</span>
            )}
          </div>
        )
      },
      hiddenOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (m: Measurement) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
            m.status === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          )}
        >
          {m.status === 'completed'
            ? <CheckCircle2 size={11} />
            : <Clock size={11} />
          }
          {m.status}
        </span>
      ),
      hiddenOnMobile: true,
    },
  ]

  const actions = (m: Measurement): TableAction[] => [
    {
      label: 'View Details',
      onClick: () => openViewModal(m),
      variant: 'default',
    },
    {
      label: 'Edit',
      onClick: () => openEditModal(m),
      variant: 'outline',
    },
    {
      label: 'Delete',
      onClick: async () => {
        if (!confirm('Delete this measurement record?')) return
        const { error } = await supabase.from('measurements').delete().eq('id', m.id)
        if (error) toast.error('Failed to delete')
        else { toast.success('Deleted'); fetchData() }
      },
      variant: 'destructive' as const,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  const completedCount = measurements.filter((m) => m.status === 'completed').length
  const pendingCount   = measurements.filter((m) => m.status === 'pending').length
  const uniqueCustomers = new Set(measurements.map((m) => m.customer_id)).size
  const hasCustomers = customers.length > 0
  const shouldShowQuickCustomerForm = showQuickCustomerForm || !hasCustomers

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <Ruler className="h-6 w-6 text-brand-gold" />
            Measurements
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Track and manage customer body measurements
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Measurement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Records"    value={measurements.length}  icon={Ruler}         color="bg-sky-100 text-sky-600"      />
        <StatCard label="Unique Customers" value={uniqueCustomers}       icon={Users}         color="bg-violet-100 text-violet-600" />
        <StatCard label="Completed"        value={completedCount}        icon={CheckCircle2}  color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Pending"          value={pendingCount}          icon={Clock}         color="bg-amber-100 text-amber-600"  />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <DataTable
          data={measurements}
          columns={columns}
          keyExtractor={(m) => m.id}
          searchKeys={['customer_id']}
          emptyMessage="No measurements recorded yet. Add your first measurement to get started."
          actions={actions}
        />
      </div>

      {/* Add Measurement Modal */}
      <ModalForm
        open={addModalOpen}
        onOpenChange={(open) => { setAddModalOpen(open); if (!open) resetForm() }}
        title="Record Measurement"
        description="Select a customer, or quickly add one here, then record standard or custom measurements."
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
        submitLabel="Save Measurements"
        maxWidth="2xl"
      >
        <div className="space-y-6">

          {/* Customer select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Customer *</Label>
              {hasCustomers && !shouldShowQuickCustomerForm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-brand-gold hover:text-brand-ink"
                  onClick={() => setShowQuickCustomerForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add customer here
                </Button>
              )}
            </div>
            <select
              className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
              disabled={!hasCustomers}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCustomerName(c)}
                </option>
              ))}
            </select>
            {!hasCustomers && (
              <p className="text-xs text-brand-stone">
                Add your first customer below, then continue recording measurements.
              </p>
            )}
            {hasCustomers && !shouldShowQuickCustomerForm && (
              <p className="text-xs text-brand-stone">
                Need someone new? Add a customer without leaving this measurement form.
              </p>
            )}
          </div>

          {shouldShowQuickCustomerForm && (
            <div className="rounded-2xl border border-brand-border bg-brand-cream/30 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-ink">Quick Add Customer</p>
                  <p className="text-xs text-brand-stone">
                    Only first name is required. You can complete the rest later from Customers.
                  </p>
                </div>
                {hasCustomers && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={() => {
                      setShowQuickCustomerForm(false)
                      setQuickCustomerForm(initialQuickCustomerForm)
                    }}
                    disabled={isCreatingCustomer}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quick-customer-first-name">First Name *</Label>
                  <Input
                    id="quick-customer-first-name"
                    value={quickCustomerForm.firstName}
                    onChange={(event) =>
                      setQuickCustomerForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    onKeyDown={handleQuickCustomerKeyDown}
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-customer-last-name">Last Name</Label>
                  <Input
                    id="quick-customer-last-name"
                    value={quickCustomerForm.lastName}
                    onChange={(event) =>
                      setQuickCustomerForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    onKeyDown={handleQuickCustomerKeyDown}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-customer-email">Email</Label>
                  <Input
                    id="quick-customer-email"
                    type="email"
                    value={quickCustomerForm.email}
                    onChange={(event) =>
                      setQuickCustomerForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    onKeyDown={handleQuickCustomerKeyDown}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-customer-phone">Phone</Label>
                  <Input
                    id="quick-customer-phone"
                    value={quickCustomerForm.phone}
                    onChange={(event) =>
                      setQuickCustomerForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    onKeyDown={handleQuickCustomerKeyDown}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickAddCustomer}
                  disabled={isCreatingCustomer}
                >
                  {isCreatingCustomer ? 'Saving Customer...' : 'Save Customer'}
                </Button>
              </div>
            </div>
          )}

          {/* Picker */}
          <MeasurementPicker
            selectedMeasurements={selectedMeasurements}
            onToggle={toggleMeasurementField}
          />

          {/* Selected measurement value inputs */}
          {Object.keys(selectedMeasurements).length > 0 && (
            <div>
              <p className="text-sm font-medium text-brand-ink mb-3">Enter values (cm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(selectedMeasurements).map((key) => {
                  const def = STANDARD_MEASUREMENTS.find((m) => m.key === key)
                  return (
                    <div key={key} className="relative">
                      <Label className="text-xs text-brand-stone">{def?.label || key}</Label>
                      <div className="flex items-center mt-1">
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
                          className="absolute right-2 top-7 text-brand-stone hover:text-red-500"
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
            <p className="text-sm font-medium text-brand-ink mb-1">Custom Measurements</p>
            <p className="text-xs text-brand-stone mb-3">Add any measurement not in the standard list.</p>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g. Torso Length…"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
              />
              <Button type="button" variant="outline" onClick={addCustomField} disabled={!newCustomName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customMeasurements.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {customMeasurements.map((cm, idx) => (
                  <div key={idx} className="relative">
                    <Label className="text-xs text-brand-stone">{cm.name}</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={cm.value}
                        onChange={(e) =>
                          setCustomMeasurements((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                          )
                        }
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomMeasurements((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-2 top-7 text-brand-stone hover:text-red-500"
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
          <div className="space-y-2">
            <Label htmlFor="m-notes">Notes</Label>
            <Textarea
              id="m-notes"
              placeholder="Any additional notes about these measurements…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

        </div>
      </ModalForm>

      <ModalForm
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        title="Measurement Details"
        description={
          selectedMeasurement
            ? `${selectedMeasurement.customers?.first_name ?? ''} ${selectedMeasurement.customers?.last_name ?? ''}`.trim()
            : ''
        }
        hideFooter
        maxWidth="lg"
      >
        {selectedMeasurement && (
          <MeasurementDetails measurement={selectedMeasurement} />
        )}
      </ModalForm>

      <ModalForm
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open)
          if (!open) setEditableMeasurement(null)
        }}
        title="Edit Measurement"
        description={editableMeasurement?.customerName || 'Update measurement details'}
        onSubmit={handleMeasurementUpdate}
        isSubmitting={isEditing}
        submitLabel="Save Changes"
        maxWidth="lg"
      >
        {editableMeasurement && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={editableMeasurement.status}
                onChange={(e) =>
                  setEditableMeasurement((prev) =>
                    prev ? { ...prev, status: e.target.value as Measurement['status'] } : prev
                  )
                }
                className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <MeasurementInputFields
              title="Standard Measurements"
              values={editableMeasurement.standard}
              onChange={(key, value) =>
                setEditableMeasurement((prev) =>
                  prev ? { ...prev, standard: { ...prev.standard, [key]: value } } : prev
                )
              }
            />

            <MeasurementInputFields
              title="Custom Measurements"
              values={editableMeasurement.custom}
              onChange={(key, value) =>
                setEditableMeasurement((prev) =>
                  prev ? { ...prev, custom: { ...prev.custom, [key]: value } } : prev
                )
              }
            />

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editableMeasurement.notes}
                onChange={(e) =>
                  setEditableMeasurement((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
                }
                rows={3}
              />
            </div>
          </div>
        )}
      </ModalForm>

    </div>
  )
}

function MeasurementDetails({ measurement }: { measurement: Measurement }) {
  const entries = sortMeasurementEntries(Object.entries(extractMeasurementMaps(measurement).all))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-stone">
          {new Date(measurement.created_at).toLocaleString()}
        </span>
        <Badge
          className={cn(
            measurement.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          )}
        >
          {measurement.status}
        </Badge>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-brand-cream/50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-brand-stone uppercase block truncate">
                {formatMeasurementLabel(key)}
              </span>
              <span className="text-sm font-semibold text-brand-ink">{value} cm</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-brand-stone">No measurement values recorded.</p>
      )}

      {measurement.notes && (
        <p className="text-xs text-brand-stone pt-2 border-t border-brand-border">{measurement.notes}</p>
      )}
    </div>
  )
}

function MeasurementInputFields({
  title,
  values,
  onChange,
}: {
  title: string
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const entries = sortMeasurementEntries(
    Object.entries(values).map(([key, value]) => [key, Number.parseFloat(value) || 0])
  ).map(([key]) => [key, values[key] ?? ''] as const)

  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-ink">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <Label className="text-xs text-brand-stone">{formatMeasurementLabel(key)}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              className="mt-1"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

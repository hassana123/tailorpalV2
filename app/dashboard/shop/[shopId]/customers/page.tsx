'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { CustomerMeasurementsModal } from '@/components/dashboard/customer/CustomerMeasurementsModal'
import { CustomerDetailModal } from '@/components/dashboard/customer/CustomerDetailModal'
import {
  Plus,
  Users,
  Mail,
  Phone,
  MapPin,
  User,
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const supabase = createClient()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [measurementsModalOpen, setMeasurementsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [editForm, setEditForm] = useState<Partial<Customer>>({})

  useEffect(() => {
    fetchCustomers()
  }, [shopId])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      toast.error('First name and last name are required')
      return
    }

    try {
      setIsSubmitting(true)
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

      toast.success('Customer added successfully!')
      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        notes: '',
      })
      setAddModalOpen(false)
      await fetchCustomers()
    } catch (err) {
      console.error('Error adding customer:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !editForm.first_name || !editForm.last_name) {
      toast.error('First name and last name are required')
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase
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

      if (error) throw error

      toast.success('Customer updated successfully!')
      setEditModalOpen(false)
      await fetchCustomers()
    } catch (err) {
      console.error('Error updating customer:', err)
      toast.error('Failed to update customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return

    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerId)
      if (error) throw error

      toast.success('Customer deleted successfully!')
      await fetchCustomers()
    } catch (err) {
      console.error('Error deleting customer:', err)
      toast.error('Failed to delete customer')
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({ ...customer })
    setEditModalOpen(true)
  }

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDetailModalOpen(true)
  }

  const openMeasurementsModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setMeasurementsModalOpen(true)
  }

  // DataTable columns
  const columns = [
    {
      key: 'name',
      header: 'Customer',
      cell: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">
              {customer.first_name[0]}{customer.last_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink truncate">
              {customer.first_name} {customer.last_name}
            </p>
            <p className="text-xs text-brand-stone">
              {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (c: Customer) => `${c.first_name} ${c.last_name}`,
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (customer: Customer) => (
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'location',
      header: 'Location',
      cell: (customer: Customer) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-stone">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {[customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'}
          </span>
        </div>
      ),
      hiddenOnMobile: true,
    },
  ]

  // DataTable actions
  const actions = (customer: Customer) => [
    {
      label: 'View Details',
      onClick: () => openDetailModal(customer),
      variant: 'default' as const,
    },
    {
      label: 'Edit',
      onClick: () => openEditModal(customer),
      variant: 'outline' as const,
    },
    {
      label: 'Add Measurements',
      onClick: () => openMeasurementsModal(customer),
      variant: 'outline' as const,
    },
    {
      label: 'Delete',
      onClick: () => handleDeleteCustomer(customer.id),
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

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-gold" />
            Customers
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Manage your shop customers and their measurements
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Total Customers"
          value={customers.length}
          icon={Users}
          color="bg-sky-100 text-sky-600"
        />
        <StatCard
          label="With Email"
          value={customers.filter(c => c.email).length}
          icon={Mail}
          color="bg-violet-100 text-violet-600"
        />
        <StatCard
          label="With Phone"
          value={customers.filter(c => c.phone).length}
          icon={Phone}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="This Month"
          value={customers.filter(c => {
            const date = new Date(c.created_at)
            const now = new Date()
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
          }).length}
          icon={User}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <DataTable
          data={customers}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchKeys={['first_name', 'last_name', 'email', 'phone']}
          emptyMessage="No customers found. Add your first customer to get started."
          actions={actions}
        />
      </div>

      {/* Add Customer Modal */}
      <ModalForm
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add New Customer"
        description="Enter customer details below. All fields marked with * are required."
        onSubmit={handleAddCustomer}
        isSubmitting={isSubmitting}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              placeholder="John"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
              placeholder="Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={newCustomer.city}
              onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
              placeholder="New York"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={newCustomer.country}
              onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
              placeholder="USA"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
              placeholder="Any additional notes about this customer..."
              rows={3}
            />
          </div>
        </div>
      </ModalForm>

      {/* Edit Customer Modal */}
      <ModalForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Customer"
        description="Update customer information below."
        onSubmit={handleEditCustomer}
        isSubmitting={isSubmitting}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="editFirstName">First Name *</Label>
            <Input
              id="editFirstName"
              value={editForm.first_name || ''}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editLastName">Last Name *</Label>
            <Input
              id="editLastName"
              value={editForm.last_name || ''}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEmail">Email</Label>
            <Input
              id="editEmail"
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editPhone">Phone</Label>
            <Input
              id="editPhone"
              value={editForm.phone || ''}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="editAddress">Address</Label>
            <Input
              id="editAddress"
              value={editForm.address || ''}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editCity">City</Label>
            <Input
              id="editCity"
              value={editForm.city || ''}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editCountry">Country</Label>
            <Input
              id="editCountry"
              value={editForm.country || ''}
              onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="editNotes">Notes</Label>
            <Textarea
              id="editNotes"
              value={editForm.notes || ''}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </ModalForm>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          customer={selectedCustomer}
          onEdit={() => {
            setDetailModalOpen(false)
            openEditModal(selectedCustomer)
          }}
          onAddMeasurements={() => {
            setDetailModalOpen(false)
            openMeasurementsModal(selectedCustomer)
          }}
        />
      )}

      {/* Measurements Modal */}
      {selectedCustomer && (
        <CustomerMeasurementsModal
          open={measurementsModalOpen}
          onOpenChange={setMeasurementsModalOpen}
          customer={selectedCustomer}
          shopId={shopId}
        />
      )}
    </div>
  )
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

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
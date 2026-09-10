'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { CustomerMeasurementsModal } from '@/components/dashboard/customer/CustomerMeasurementsModal'
import { CustomerDetailModal } from '@/components/dashboard/customer/CustomerDetailModal'
import { CustomerHeader } from '@/components/dashboard/customer/CustomerHeader'
import { StatsGrid } from '@/components/dashboard/customer/StatsGrid'
import { useCustomerColumns } from '@/components/dashboard/customer/customerColumns'
import { DeleteCustomerDialog } from '@/components/dashboard/customer/DeleteCustomerDialog'
import { AddCustomerModal } from '@/components/dashboard/customer/AddCustomerModal'
import { EditCustomerModal } from '@/components/dashboard/customer/EditCustomerModal'
import { Customer, CustomerFormData, initialCustomerFormData } from './types'

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
  const [measurementsModalMode, setMeasurementsModalMode] = useState<'add' | 'edit'>('add')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCustomer, setNewCustomer] = useState<CustomerFormData>(initialCustomerFormData)
  const [editForm, setEditForm] = useState<Partial<Customer>>({})
  const [cityFilter, setCityFilter] = useState('all')

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
    if (!newCustomer.firstName.trim()) {
      toast.error('First name is required')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          firstName: newCustomer.firstName.trim(),
          lastName: newCustomer.lastName.trim() || undefined,
          email: newCustomer.email || undefined,
          phone: newCustomer.phone || undefined,
          address: newCustomer.address || undefined,
          city: newCustomer.city || undefined,
          country: newCustomer.country || undefined,
          notes: newCustomer.notes || undefined,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add customer')
      }

      toast.success('Customer added successfully!')
      const createdCustomer = payload.customer as Customer | undefined
      const shouldOpenMeasurements = Boolean(createdCustomer && newCustomer.addMeasurementsNow)
      setNewCustomer(initialCustomerFormData)
      setAddModalOpen(false)
      await fetchCustomers()
      if (shouldOpenMeasurements && createdCustomer) {
        setSelectedCustomer(createdCustomer)
        setMeasurementsModalMode('add')
        setMeasurementsModalOpen(true)
      }
    } catch (err) {
      console.error('Error adding customer:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !editForm.first_name?.trim()) {
      toast.error('First name is required')
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name?.trim() || null,
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

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('customers').delete().eq('id', selectedCustomer.id)
      if (error) throw error

      toast.success('Customer deleted successfully!')
      setDeleteDialogOpen(false)
      setSelectedCustomer(null)
      await fetchCustomers()
    } catch (err) {
      console.error('Error deleting customer:', err)
      toast.error('Failed to delete customer')
    } finally {
      setIsSubmitting(false)
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

  const openMeasurementsModal = (customer: Customer, mode: 'add' | 'edit' = 'add') => {
    setSelectedCustomer(customer)
    setMeasurementsModalMode(mode)
    setMeasurementsModalOpen(true)
  }

  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDeleteDialogOpen(true)
  }

  // Use customer columns hook
  const { columns, actions } = useCustomerColumns({
    onViewDetails: openDetailModal,
    onEdit: openEditModal,
    onAddMeasurements: openMeasurementsModal,
    onDelete: openDeleteDialog,
  })

  const visibleCustomers = cityFilter === 'all' ? customers : customers.filter((customer) => (customer.city || 'Unspecified') === cityFilter)
  const cities = [...new Set(customers.map((customer) => customer.city || 'Unspecified'))].sort()

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
      <CustomerHeader onAddCustomer={() => setAddModalOpen(true)} />

      {/* Stats */}
      <StatsGrid customers={customers} />

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 lg:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border">
          <div>
            <h2 className="font-display text-xl text-brand-ink">Client Directory</h2>
            <p className="text-xs text-brand-stone mt-0.5">Manage client profiles, measurements, and commission history</p>
          </div>
          {cities.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-cream border border-brand-border rounded-xl">
              <span className="text-xs text-brand-gold">📍</span>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="bg-transparent text-xs font-semibold text-brand-ink focus:outline-none cursor-pointer"
                aria-label="Filter customers by location"
              >
                <option value="all">All Locations ({customers.length})</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DataTable
          data={visibleCustomers}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchKeys={['first_name', 'last_name', 'email', 'phone']}
          emptyMessage="No customers found. Add your first customer to get started."
          actions={actions}
        />
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        formData={newCustomer}
        onFormDataChange={setNewCustomer}
        onSubmit={handleAddCustomer}
        isSubmitting={isSubmitting}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        formData={editForm}
        onFormDataChange={setEditForm}
        onEditMeasurements={() => {
          if (!selectedCustomer) return
          setEditModalOpen(false)
          openMeasurementsModal(selectedCustomer, 'edit')
        }}
        onSubmit={handleEditCustomer}
        isSubmitting={isSubmitting}
      />

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
          mode={measurementsModalMode}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        customer={selectedCustomer}
        onConfirm={handleDeleteCustomer}
        isLoading={isSubmitting}
      />
    </div>
  )
}

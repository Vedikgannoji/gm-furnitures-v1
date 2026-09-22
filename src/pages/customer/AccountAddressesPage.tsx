import React, { useState } from 'react'
import { Plus, MapPin, Check, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockCustomers } from '@/data/mockData'
import { ShippingAddress } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AccountAddressesPage: React.FC = () => {
  const { showToast } = useToast()
  const [addresses, setAddresses] = useState<ShippingAddress[]>(
    mockCustomers[0].addresses
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAddr, setNewAddr] = useState<ShippingAddress>({
    fullName: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false,
  })

  const handleSetDefault = (index: number) => {
    setAddresses((prev) =>
      prev.map((addr, i) => ({
        ...addr,
        isDefault: i === index,
      }))
    )
    showToast('Default Updated', 'Primary delivery address set.', 'success')
  }

  const handleDelete = (index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index))
    showToast('Address Deleted', 'Location removed from your client address book.', 'info')
  }

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault()
    setAddresses((prev) => [...prev, newAddr])
    setIsModalOpen(false)
    showToast('Address Added', 'New delivery location registered.', 'success')
    setNewAddr({
      fullName: '',
      streetAddress: '',
      apartment: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      isDefault: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-light text-foreground">Delivery Locations</h2>
          <p className="text-xs text-muted mt-1">
            Registered residential and architecture studio sites for White-Glove installation.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Location</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((addr, idx) => (
          <div
            key={idx}
            className={`p-6 border bg-background relative flex flex-col justify-between ${
              addr.isDefault ? 'border-foreground' : 'border-border'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {addr.fullName}
                </span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider">
                    Primary
                  </span>
                )}
              </div>

              <div className="text-xs text-muted space-y-1">
                <p>{addr.streetAddress}</p>
                {addr.apartment && <p>{addr.apartment}</p>}
                <p>
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="pt-2 font-mono text-[11px]">Phone: {addr.phone}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
              {!addr.isDefault ? (
                <button
                  onClick={() => handleSetDefault(idx)}
                  className="text-muted hover:text-foreground underline"
                >
                  Set as Primary
                </button>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Default Delivery Site
                </span>
              )}

              <button
                onClick={() => handleDelete(idx)}
                className="text-muted hover:text-rose-600 transition-colors p-1"
                aria-label="Delete location"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Delivery Location"
        description="Register a new site for specialized furniture freight and assembly."
      >
        <form onSubmit={handleAddAddress} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Contact / Recipient Name
            </label>
            <input
              type="text"
              required
              value={newAddr.fullName}
              onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
              className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Street Address
            </label>
            <input
              type="text"
              required
              value={newAddr.streetAddress}
              onChange={(e) => setNewAddr({ ...newAddr, streetAddress: e.target.value })}
              className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Apartment / Tower / Suite
            </label>
            <input
              type="text"
              value={newAddr.apartment}
              onChange={(e) => setNewAddr({ ...newAddr, apartment: e.target.value })}
              className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                PIN Code
              </label>
              <input
                type="text"
                required
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Mobile Phone
            </label>
            <input
              type="tel"
              required
              value={newAddr.phone}
              onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
              className="w-full h-9 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

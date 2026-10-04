import React, { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

interface StoredAddress {
  id: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export const AccountAddressesPage: React.FC = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const [addresses, setAddresses] = useState<StoredAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  const fetchAddresses = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
      }
    } catch (err) {
      console.error('Failed to load addresses:', err)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleDelete = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id))
        showToast('Address Removed', 'Address removed successfully.', 'info')
      }
    } catch (err) {
      showToast('Error', 'Failed to remove address.', 'error')
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone,
          addressLine,
          city,
          state,
          pincode,
          isDefault,
        }),
      })

      if (res.ok) {
        showToast('Address Saved', 'New delivery location registered.', 'success')
        setIsModalOpen(false)
        setFullName('')
        setPhone('')
        setAddressLine('')
        setCity('')
        setState('')
        setPincode('')
        setIsDefault(false)
        fetchAddresses()
      } else {
        const data = await res.json()
        showToast('Failed to Save', data.error || 'Could not save address.', 'error')
      }
    } catch (err) {
      showToast('Error', 'Network error saving address.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-light text-foreground">Delivery Addresses</h2>
          <p className="text-xs text-muted mt-1">
            Manage your saved delivery addresses.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Address</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted">
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center bg-surface/50">
          <MapPin className="w-8 h-8 text-muted mx-auto mb-3 stroke-[1.2]" />
          <h3 className="text-sm font-medium text-foreground">No Addresses Saved</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            You have not saved any delivery addresses yet. Add an address for faster checkout.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-xs uppercase tracking-wider"
          >
            Add Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-6 border bg-background relative flex flex-col justify-between ${
                addr.isDefault ? 'border-foreground shadow-sm' : 'border-border'
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
                  <p>{addr.addressLine}</p>
                  <p>
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="pt-2 font-mono text-[11px] text-foreground">Tel: {addr.phone}</p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 mt-4 border-t border-border">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-muted hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Delivery Location"
        maxWidth="md"
      >
        <form onSubmit={handleAddAddress} className="space-y-4 pt-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Recipient / Site Contact Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aditya Mehta"
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Site Contact Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Complete Street Address / Residence Name
            </label>
            <input
              type="text"
              required
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="e.g. Flat 402, Jubilee Hills Villa"
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Hyderabad"
                className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Telangana"
                className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Pincode
            </label>
            <input
              type="text"
              required
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="500033"
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded-none border-border text-foreground focus:ring-0"
            />
            <label htmlFor="isDefault" className="text-xs text-foreground cursor-pointer">
              Set as primary delivery location
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

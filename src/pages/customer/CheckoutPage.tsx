import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Home,
  Briefcase,
  MapPin,
  CreditCard,
  Building2,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { formatCurrency } from '@/lib/utils'
import { Address } from '@/types'

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { settings } = useSettings()
  const {
    items,
    subtotal,
    assemblyCharge,
    convenienceFee,
    convenienceFeePercent,
    gst,
    gstPercent,
    total,
    clearCart,
  } = useCart()

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new')
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState('')
  const [saveNewAddress, setSaveNewAddress] = useState(true)

  // New Address form fields
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    label: 'Home' as 'Home' | 'Office' | 'Other',
  })

  // Load saved addresses from Neon PostgreSQL
  useEffect(() => {
    if (!token) {
      setIsLoadingAddresses(false)
      return
    }
    fetch('/api/addresses', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs)
          const def = addrs.find((a) => a.isDefault) || addrs[0]
          setSelectedAddressId(def.id)
        } else {
          setSelectedAddressId('new')
        }
      })
      .catch((err) => console.error('Failed to load saved addresses:', err))
      .finally(() => setIsLoadingAddresses(false))
  }, [token])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleProceedToPay = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    let deliveryAddress: {
      fullName: string
      phone: string
      addressLine: string
      city: string
      state: string
      pincode: string
    }

    if (selectedAddressId !== 'new') {
      const selected = savedAddresses.find((a) => a.id === selectedAddressId)
      if (!selected) {
        alert('Please select a valid delivery address.')
        setIsProcessing(false)
        return
      }
      deliveryAddress = {
        fullName: selected.fullName,
        phone: selected.phone,
        addressLine: selected.addressLine,
        city: selected.city,
        state: selected.state,
        pincode: selected.pincode,
      }
    } else {
      if (!formData.fullName.trim() || !formData.phone.trim() || !formData.addressLine.trim() || !formData.pincode.trim()) {
        alert('Please complete all delivery address fields.')
        setIsProcessing(false)
        return
      }
      deliveryAddress = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine: formData.addressLine.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      }

      // If user checked "Save this address", persist to PostgreSQL
      if (saveNewAddress && token) {
        try {
          await fetch('/api/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fullName: deliveryAddress.fullName,
              phone: deliveryAddress.phone,
              addressLine: deliveryAddress.addressLine,
              city: deliveryAddress.city,
              state: deliveryAddress.state,
              pincode: deliveryAddress.pincode,
              label: formData.label,
              isDefault: savedAddresses.length === 0,
            }),
          })
        } catch (err) {
          console.error('Failed to save new address to database:', err)
        }
      }
    }

    try {
      // POST order to PostgreSQL with pending status (prepping Cashfree)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            product: {
              id: it.product.id,
              name: it.product.name,
              images: it.product.images,
            },
            quantity: it.quantity,
            selectedColor: it.selectedColor,
            price: it.product.price,
          })),
          deliveryAddress,
          subtotal,
          assemblyCharge,
          convenienceFee,
          convenienceFeePercent,
          gst,
          gstPercent,
          discount: 0,
          total,
          paymentGateway: 'cashfree',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedOrderNumber(data.order.orderNumber)
        setIsSuccessModalOpen(true)
        clearCart()
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to initialize payment order.')
      }
    } catch (err) {
      console.error('Order creation error:', err)
      alert('Network error while initializing order.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0 && !isSuccessModalOpen) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-medium text-foreground">No Items to Checkout</h2>
        <p className="text-xs text-muted mt-2">
          Your shopping bag is currently empty. Please select furniture to proceed.
        </p>
        <Link to="/shop" className="inline-block mt-6">
          <Button variant="primary" size="md">
            EXPLORE CATALOG →
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs
        items={[
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="mb-6 sm:mb-8 pb-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="editorial-badge">Secure Checkout</span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mt-1">
            Delivery & Payment
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handleProceedToPay}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Checkout (Left Column) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Delivery Address Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                  1. Delivery Address
                </h2>
                {settings.gstin && (
                  <span className="text-[10px] text-muted font-mono">
                    GSTIN: {settings.gstin}
                  </span>
                )}
              </div>

              {/* Saved Addresses List */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted block">
                    Choose from Saved Addresses:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id
                      return (
                        <label
                          key={addr.id}
                          className={`p-4 border rounded cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-foreground bg-surface ring-1 ring-foreground'
                              : 'border-border hover:border-foreground/50 bg-background'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="addressSelection"
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="accent-foreground mt-0.5"
                              />
                              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                {addr.label === 'Office' ? (
                                  <Briefcase className="w-3.5 h-3.5 text-muted" />
                                ) : (
                                  <Home className="w-3.5 h-3.5 text-muted" />
                                )}
                                {addr.label || 'Home'}
                              </span>
                            </div>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-medium">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 text-xs text-muted pl-6 space-y-0.5">
                            <p className="font-medium text-foreground">{addr.fullName}</p>
                            <p>{addr.addressLine}</p>
                            <p>
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-[11px] text-muted/80">{addr.phone}</p>
                          </div>
                        </label>
                      )
                    })}

                    {/* Radio option for Add New Address */}
                    <label
                      className={`p-4 border rounded cursor-pointer transition-all flex items-center gap-3 ${
                        selectedAddressId === 'new'
                          ? 'border-foreground bg-surface ring-1 ring-foreground'
                          : 'border-dashed border-border hover:border-foreground/50 bg-background'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        checked={selectedAddressId === 'new'}
                        onChange={() => setSelectedAddressId('new')}
                        className="accent-foreground"
                      />
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Plus className="w-4 h-4 text-muted" />
                        <span>Add New Address</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Add New Address Form (Visible when 'new' is selected or no saved addresses) */}
              {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                <div className="bg-surface border border-border p-5 rounded space-y-4 text-xs mt-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-semibold uppercase tracking-wider text-foreground text-[11px]">
                      New Delivery Address Details
                    </span>
                    <div className="flex items-center gap-3">
                      {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                        <label key={lbl} className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="label"
                            value={lbl}
                            checked={formData.label === lbl}
                            onChange={handleInputChange}
                            className="accent-foreground"
                          />
                          <span className="text-[11px] text-foreground">{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                      Street Address / Villa / Apartment *
                    </label>
                    <input
                      type="text"
                      name="addressLine"
                      required
                      value={formData.addressLine}
                      onChange={handleInputChange}
                      placeholder="Flat 402, Oakwood Towers, Road No. 12"
                      className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {token && (
                    <label className="inline-flex items-center gap-2 cursor-pointer pt-1 select-none">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="w-4 h-4 accent-foreground"
                      />
                      <span className="text-[11px] text-muted">
                        Save this address to my account for future checkouts
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* 2. Payment Gateway Information (Cashfree Prepared) */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-border">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                  2. Payment Method
                </h2>
              </div>

              <div className="p-5 bg-surface border border-border rounded space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-foreground" />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Cashfree Payments Gateway
                      </span>
                      <span className="text-[11px] text-muted">
                        UPI, Cards (Visa, MasterCard, RuPay), Net Banking & EMI
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Encrypted
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  Clicking <strong className="text-foreground">PROCEED TO PAY</strong> will initiate a secure payment session. All major Indian payment methods are supported with instant bank verification.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Order Summary (Right Column) */}
          <div className="lg:col-span-5 bg-surface border border-border p-6 sm:p-8 sticky top-24 rounded">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-4 border-b border-border">
              Order Review ({items.length} {items.length === 1 ? 'Piece' : 'Pieces'})
            </h3>

            {/* Line items preview */}
            <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="py-3 flex gap-3 items-center">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-14 object-cover border border-border shrink-0 bg-background"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-[11px] text-muted">
                      Qty: {item.quantity} • {item.selectedColor}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-foreground shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial breakdown strictly following Requirement 10 */}
            <div className="pt-4 border-t border-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Product Price</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">Assembly Charge</span>
                <span className="font-semibold text-foreground">{formatCurrency(assemblyCharge)}</span>
              </div>

              {convenienceFeePercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Convenience Fee ({convenienceFeePercent}%)</span>
                  <span className="font-semibold text-foreground">{formatCurrency(convenienceFee)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted">GST on Convenience Fee ({gstPercent}%)</span>
                <span className="font-semibold text-foreground">{formatCurrency(gst)}</span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Grand Total
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Submit button: PROCEED TO PAY */}
            <div className="mt-8">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isProcessing}
                className="w-full text-xs uppercase tracking-widest font-semibold"
              >
                PROCEED TO PAY &rarr;
              </Button>
            </div>

            <p className="text-[10px] text-muted text-center mt-3">
              Standard terms of sale apply. Official GST tax invoice will be generated.
            </p>
          </div>
        </div>
      </form>

      {/* Order Confirmation Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false)
          navigate('/account/orders')
        }}
        maxWidth="lg"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="editorial-badge text-muted">Order Initialized</span>
          <h3 className="text-2xl font-light text-foreground mt-2 tracking-tight">
            Order Reference: {generatedOrderNumber}
          </h3>
          <p className="text-xs text-muted mt-2 max-w-md mx-auto leading-relaxed">
            Your furniture order has been recorded in the database. When Cashfree payment is integrated, payment verification will confirm and dispatch your order.
          </p>

          <div className="mt-6 p-4 bg-surface border border-border text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Order ID:</span>
              <span className="font-mono font-semibold">{generatedOrderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Amount Payable:</span>
              <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
            </div>
            {settings.gstin && (
              <div className="flex justify-between">
                <span className="text-muted">Store GSTIN:</span>
                <span className="font-mono">{settings.gstin}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/account/orders" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                View in My Orders
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                Return to Storefront
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}

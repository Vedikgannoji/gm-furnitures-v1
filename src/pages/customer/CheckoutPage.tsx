import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Lock,
  Plus,
  Home,
  Briefcase,
  Tag,
  X,
  Check,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { formatCurrency } from '@/lib/utils'
import { Address } from '@/types'
import { getCashfreeSDK } from '@/lib/cashfree'

interface AppliedCouponInfo {
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  discountAmount: number
  finalPayable: number
}

export const CheckoutPage: React.FC = () => {
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
  } = useCart()

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new')
  const [, setIsLoadingAddresses] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saveNewAddress, setSaveNewAddress] = useState(true)

  // Coupon State
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

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
    setErrorMessage(null)
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
        setErrorMessage('Please select a valid delivery address.')
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
      if (
        !formData.fullName.trim() ||
        !formData.phone.trim() ||
        !formData.addressLine.trim() ||
        !formData.pincode.trim()
      ) {
        setErrorMessage('Please complete all delivery address fields.')
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

    // Validate 10-digit phone number
    const phoneDigits = deliveryAddress.phone.replace(/\D/g, '')
    const cleanPhone = phoneDigits.length > 10 && phoneDigits.startsWith('91')
      ? phoneDigits.slice(2)
      : phoneDigits

    if (cleanPhone.length !== 10) {
      setErrorMessage('Please provide a valid 10-digit Indian mobile number for order delivery.')
      setIsProcessing(false)
      return
    }

    try {
      // 1. Create order on backend & initialize Cashfree session
      const res = await fetch('/api/payments/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
            selectedColor: it.selectedColor,
          })),
          deliveryAddress,
          couponCode: appliedCoupon?.code || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setErrorMessage(errData.error || 'Unable to start payment. Please try again.')
        setIsProcessing(false)
        return
      }

      const data = await res.json()
      const { paymentSessionId, environment } = data

      if (!paymentSessionId) {
        setErrorMessage('Unable to initialize payment session. Please try again.')
        setIsProcessing(false)
        return
      }

      // 2. Load official Cashfree SDK and trigger checkout
      let CashfreeSDK
      try {
        CashfreeSDK = await getCashfreeSDK()
      } catch (err) {
        console.error('Failed to load Cashfree SDK:', err)
        setErrorMessage('Payment service is temporarily unavailable. Please try again.')
        setIsProcessing(false)
        return
      }

      const cashfree = CashfreeSDK({
        mode: environment === 'production' ? 'production' : 'sandbox',
      })

      // 3. Open Cashfree Checkout (Customer chooses UPI/Cards/Netbanking on Cashfree)
      cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_self',
      })
    } catch (err) {
      console.error('Order creation error:', err)
      setErrorMessage('Network error while initializing payment. Please try again.')
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
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
          {/* Main Checkout (Left Column: Delivery Address) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                  Delivery Address
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

            {/* Coupon Code Section */}
            <div className="pt-4 border-t border-border space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Coupon Code</span>
              </span>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-950 uppercase">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-emerald-200/80 text-emerald-800 rounded">
                          {appliedCoupon.discountType === 'percent'
                            ? `${appliedCoupon.discountValue}% OFF`
                            : `${formatCurrency(appliedCoupon.discountValue)} OFF`}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        You saved {formatCurrency(appliedCoupon.discountAmount)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null)
                      setCouponError(null)
                    }}
                    className="p-1 text-muted hover:text-rose-600 transition-colors"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase())
                        if (couponError) setCouponError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const code = couponInput.trim().toUpperCase()
                          if (code) {
                            setIsApplyingCoupon(true)
                            fetch('/api/coupons/validate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                code,
                                subtotal,
                                assemblyCharge,
                                convenienceFee,
                                gst,
                                grandTotal: total,
                              }),
                            })
                              .then((r) => r.json())
                              .then((d) => {
                                if (d.valid) {
                                  try {
                                    confetti({
                                      particleCount: 65,
                                      spread: 60,
                                      origin: { y: 0.65 },
                                      colors: ['#18181b', '#d4af37', '#b8860b', '#10b981'],
                                      disableForReducedMotion: true,
                                    })
                                  } catch (err) {
                                    console.warn('Confetti error:', err)
                                  }
                                  setAppliedCoupon(d)
                                  setCouponInput('')
                                } else {
                                  setCouponError(d.error || 'Invalid or expired coupon.')
                                }
                              })
                              .catch(() => setCouponError('Failed to validate coupon.'))
                              .finally(() => setIsApplyingCoupon(false))
                          }
                        }
                      }}
                      className="flex-1 h-9 bg-background border border-border px-3 font-mono font-medium text-xs uppercase tracking-wider focus:border-foreground focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      isLoading={isApplyingCoupon}
                      onClick={async () => {
                        const code = couponInput.trim().toUpperCase()
                        if (!code) return
                        setIsApplyingCoupon(true)
                        try {
                          const res = await fetch('/api/coupons/validate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              code,
                              subtotal,
                              assemblyCharge,
                              convenienceFee,
                              gst,
                              grandTotal: total,
                            }),
                          })
                          const d = await res.json()
                          if (res.ok && d.valid) {
                            try {
                              confetti({
                                particleCount: 65,
                                spread: 60,
                                origin: { y: 0.65 },
                                colors: ['#18181b', '#d4af37', '#b8860b', '#10b981'],
                                disableForReducedMotion: true,
                              })
                            } catch (err) {
                              console.warn('Confetti error:', err)
                            }
                            setAppliedCoupon(d)
                            setCouponInput('')
                          } else {
                            setCouponError(d.error || 'Invalid or expired coupon code.')
                          }
                        } catch {
                          setCouponError('Failed to validate coupon.')
                        } finally {
                          setIsApplyingCoupon(false)
                        }
                      }}
                      className="px-4 text-xs font-semibold uppercase tracking-wider"
                    >
                      APPLY
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 pl-0.5">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Financial breakdown */}
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

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Grand Total
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(appliedCoupon ? Math.max(0, total - appliedCoupon.discountAmount) : total)}
                </span>
              </div>
            </div>

            {/* Submit button: PROCEED TO PAY */}
            <div className="mt-8">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isProcessing}
                isLoading={isProcessing}
                className="w-full text-xs uppercase tracking-widest font-semibold"
              >
                {isProcessing ? 'Connecting to secure payment...' : 'PROCEED TO PAY →'}
              </Button>

              {errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded leading-relaxed text-center">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted text-center mt-3">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Cashfree Payments · Official Gateway</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

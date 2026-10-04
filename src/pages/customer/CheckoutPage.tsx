import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  Truck,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { items, subtotal, tax, shipping, total, clearCart } = useCart()

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card')
  const [shippingOption, setShippingOption] = useState<'white_glove' | 'standard'>('white_glove')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState('')

  // Form states defaulting from authenticated user
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    apartment: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    cardNumber: '•••• •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvv: '•••',
    upiId: '',
    bank: 'HDFC Bank',
  })

  // Prefill default address from API if available
  useEffect(() => {
    if (!token) return
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          const primary = addrs.find((a) => a.isDefault) || addrs[0]
          setFormData((prev) => ({
            ...prev,
            firstName: primary.fullName?.split(' ')[0] || prev.firstName,
            lastName: primary.fullName?.split(' ').slice(1).join(' ') || prev.lastName,
            phone: primary.phone || prev.phone,
            address: primary.addressLine || prev.address,
            city: primary.city || prev.city,
            state: primary.state || prev.state,
            pincode: primary.pincode || prev.pincode,
          }))
        }
      })
      .catch((err) => console.error('Failed to load prefill address:', err))
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const whiteGloveExtra = shippingOption === 'white_glove' ? 0 : 0
  const grandTotal = total + whiteGloveExtra

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || user?.name || 'Customer'
    const deliveryAddress = {
      fullName,
      phone: formData.phone || '+91 7013672894',
      addressLine: formData.apartment ? `${formData.address}, ${formData.apartment}` : formData.address || 'Bespoke Residence',
      city: formData.city || 'Hyderabad',
      state: formData.state || 'Telangana',
      pincode: formData.pincode || '500033',
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
          discount: 0,
          total: grandTotal,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedOrderNumber(data.order.orderNumber)
        setIsSuccessModalOpen(true)
        clearCart()
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to place order.')
      }
    } catch (err) {
      console.error('Order placement error:', err)
      alert('Network error while placing order.')
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
          { label: 'Secure Checkout' },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="mb-6 sm:mb-8 pb-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="editorial-badge">Encrypted Transaction</span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mt-1">
            Checkout & Delivery
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Secured</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Checkout Inputs (Left) */}
          <div className="lg:col-span-7 space-y-10">
            {/* 1. Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
                1. Customer & Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Mobile Phone (For delivery coordination)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
                2. Residential / Studio Delivery Address
              </h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Street Address / Villa Number
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Apartment, Tower, Suite, or Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleChange}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Delivery Method */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
                3. Specialized Freight Service
              </h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border border-foreground bg-surface cursor-pointer">
                  <input
                    type="radio"
                    name="shippingOption"
                    checked={shippingOption === 'white_glove'}
                    onChange={() => setShippingOption('white_glove')}
                    className="accent-foreground mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      White-Glove In-Room Placement & Full Assembly (Recommended)
                    </p>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Two-person certified crew positions piece in chosen room, installs joinery, checks level balance, and disposes of all packaging and timber crating.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 border border-border hover:border-foreground/50 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingOption"
                    checked={shippingOption === 'standard'}
                    onChange={() => setShippingOption('standard')}
                    className="accent-foreground mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Threshold Freight Delivery
                    </p>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Delivery to front entrance or apartment threshold. Self-assembly using included instructions and hex hardware.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Payment Method UI */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                  4. Payment Gateway Selection (Phase 1 Simulated)
                </h2>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Test Mock Active
                </span>
              </div>

              {/* Payment selector tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-foreground bg-surface text-foreground font-semibold'
                      : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-foreground bg-surface text-foreground font-semibold'
                      : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-foreground bg-surface text-foreground font-semibold'
                      : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Payment Input Details */}
              <div className="p-5 bg-surface border border-border">
                {paymentMethod === 'card' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        Card Number (Simulated)
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="w-full h-10 bg-background border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                          Expiry MM/YY
                        </label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleChange}
                          className="w-full h-10 bg-background border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="text"
                          name="cardCvv"
                          value={formData.cardCvv}
                          onChange={handleChange}
                          className="w-full h-10 bg-background border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                        Virtual Payment Address (VPA / UPI ID)
                      </label>
                      <input
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-muted">
                      A payment request will be simulated to your UPI app.
                    </p>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-3 text-xs">
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                      Select Primary Banking Institution
                    </label>
                    <select
                      name="bank"
                      value={formData.bank}
                      onChange={handleChange}
                      className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Order Summary (Right) */}
          <div className="lg:col-span-5 bg-surface border border-border p-6 sm:p-8 sticky top-24">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-4 border-b border-border">
              Order Review ({items.length} Line {items.length === 1 ? 'Item' : 'Items'})
            </h3>

            {/* Line items preview */}
            <div className="divide-y divide-border/60 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="py-3 flex gap-3 items-center">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-14 object-cover border border-border shrink-0"
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

            {/* Financial breakdown */}
            <div className="pt-4 border-t border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">GST Tax (18%)</span>
                <span className="font-semibold text-foreground">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">White-Glove Logistics</span>
                <span className="font-semibold text-emerald-700 uppercase text-[11px]">
                  {shipping === 0 ? 'Complimentary' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Grand Total
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <div className="mt-8">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isProcessing}
                className="w-full text-xs uppercase tracking-widest font-semibold"
              >
                Place Order & Confirm &rarr;
              </Button>
            </div>

            <p className="text-[10px] text-muted text-center mt-3">
              By confirming, you agree to GM Furniture's terms of service and delivery schedule.
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

          <span className="editorial-badge text-muted">Order Placed Successfully</span>
          <h3 className="text-2xl font-light text-foreground mt-2 tracking-tight">
            Thank you, {formData.firstName}.
          </h3>
          <p className="text-xs text-muted mt-2 max-w-md mx-auto leading-relaxed">
            Your furniture order <span className="font-mono font-semibold text-foreground">{generatedOrderNumber}</span> has been assigned to our atelier queue. A formal GST invoice and shipment tracker will be issued shortly.
          </p>

          <div className="mt-6 p-4 bg-surface border border-border text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Reference:</span>
              <span className="font-mono font-semibold">{generatedOrderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Estimated Delivery:</span>
              <span className="font-semibold text-foreground">3-5 Business Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery Address:</span>
              <span className="text-foreground text-right truncate max-w-[200px]">
                {formData.address}, {formData.city}
              </span>
            </div>
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

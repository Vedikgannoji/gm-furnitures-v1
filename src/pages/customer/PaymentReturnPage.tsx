import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface ConfirmedOrderItem {
  productId?: string
  name: string
  price: number
  quantity: number
  selectedColor?: string
  image?: string
  images?: string[]
}

interface ConfirmedOrder {
  id: string
  orderNumber: string
  subtotal: number
  assemblyCharge: number
  convenienceFee: number
  convenienceFeePercent: number
  gst: number
  gstPercent: number
  couponCode?: string | null
  couponDiscountAmount?: number
  total: number
  paymentGateway?: string
  deliveryAddress?: {
    fullName?: string
    addressLine?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  }
  items?: ConfirmedOrderItem[]
}

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { token } = useAuth()
  const { refreshCart } = useCart()

  const orderIdParam = searchParams.get('order_id')

  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'SUCCESS' | 'PENDING' | 'FAILED'>('checking')
  const [order, setOrder] = useState<ConfirmedOrder | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRechecking, setIsRechecking] = useState(false)

  const verifyPayment = useCallback(async () => {
    if (!orderIdParam) {
      setPaymentStatus('FAILED')
      setErrorMessage('No order ID provided in return URL.')
      return
    }

    try {
      const res = await fetch(`/api/payments/cashfree/status?order_id=${encodeURIComponent(orderIdParam)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)

        if (data.paymentStatus === 'SUCCESS') {
          setPaymentStatus('SUCCESS')
          refreshCart().catch((err) => console.error('Error refreshing cart:', err))
        } else if (data.paymentStatus === 'FAILED') {
          setPaymentStatus('FAILED')
          setErrorMessage(data.message || 'Payment was not completed.')
        } else {
          setPaymentStatus('PENDING')
        }
      } else {
        const errJson = await res.json().catch(() => ({}))
        setPaymentStatus('FAILED')
        setErrorMessage(errJson.error || 'Unable to verify payment status.')
      }
    } catch (err) {
      console.error('Error verifying payment:', err)
      setPaymentStatus('FAILED')
      setErrorMessage('Network error while verifying payment status.')
    }
  }, [orderIdParam, token, refreshCart])

  useEffect(() => {
    verifyPayment()
  }, [verifyPayment])

  const handleRecheck = async () => {
    setIsRechecking(true)
    await verifyPayment()
    setIsRechecking(false)
  }

  // 1. Initial Checking State
  if (paymentStatus === 'checking') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        <Breadcrumbs
          items={[
            { label: 'Checkout', href: '/checkout' },
            { label: 'Payment Verification' },
          ]}
          className="mb-6"
        />

        <div className="max-w-xl mx-auto py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-foreground mb-4" />
          <span className="editorial-badge text-muted">Cashfree Gateway</span>
          <h1 className="text-2xl font-light text-foreground mt-2 tracking-tight">
            Verifying Your Payment...
          </h1>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Please wait while we confirm your transaction securely with Cashfree.
            Do not refresh or close this page.
          </p>
        </div>
      </div>
    )
  }

  // 2. Successful Payment State
  if (paymentStatus === 'SUCCESS' && order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        <Breadcrumbs
          items={[
            { label: 'Checkout', href: '/checkout' },
            { label: 'Order Confirmation' },
          ]}
          className="mb-6"
        />

        <div className="max-w-3xl mx-auto bg-background border border-border p-6 sm:p-10 rounded">
          <div className="flex flex-col items-center text-center pb-8 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="editorial-badge text-emerald-800 bg-emerald-50 border border-emerald-200">
              Payment: Paid · Confirmed
            </span>

            <h1 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight uppercase">
              ORDER CONFIRMED
            </h1>

            <p className="text-xs sm:text-sm text-muted mt-2 max-w-md leading-relaxed">
              Thank you for choosing GM Furniture. Your bespoke solid wood order has been
              confirmed and recorded in our atelier ledger.
            </p>
          </div>

          {/* Quick Meta details */}
          <div className="py-6 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider">Order ID</span>
              <span className="font-mono font-semibold text-foreground mt-0.5 block">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider">Payment</span>
              <span className="font-semibold text-emerald-600 mt-0.5 block uppercase">Paid</span>
            </div>
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider">Total Amount</span>
              <span className="font-semibold text-foreground mt-0.5 block">{formatCurrency(order.total)}</span>
            </div>
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider">Payment Gateway</span>
              <span className="font-semibold text-foreground mt-0.5 block uppercase">Cashfree (Verified)</span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="py-6 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
              Ordered Pieces ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-border/60">
              {order.items?.map((it: ConfirmedOrderItem, idx: number) => {
                const img = it.image || it.images?.[0]
                return (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {img && (
                        <img
                          src={img}
                          alt={it.name}
                          className="w-12 h-14 object-cover border border-border bg-surface shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{it.name}</p>
                        <p className="text-[11px] text-muted">
                          Qty: {it.quantity} {it.selectedColor ? `• ${it.selectedColor}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-6 border-b border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Product Subtotal</span>
              <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Assembly Charge</span>
              <span className="text-foreground">{formatCurrency(order.assemblyCharge)}</span>
            </div>
            {order.convenienceFee > 0 && (
              <div className="flex justify-between text-muted">
                <span>Convenience Fee ({order.convenienceFeePercent}%)</span>
                <span className="text-foreground">{formatCurrency(order.convenienceFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>GST on Convenience Fee ({order.gstPercent}%)</span>
              <span className="text-foreground">{formatCurrency(order.gst)}</span>
            </div>
            {order.couponDiscountAmount && order.couponDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount ({order.couponCode || 'APPLIED'})</span>
                <span>-{formatCurrency(order.couponDiscountAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between font-semibold text-sm">
              <span className="uppercase tracking-wider">Grand Total Paid</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div className="py-6 border-b border-border text-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                Delivery Address
              </h3>
              <p className="font-medium text-foreground">{order.deliveryAddress.fullName}</p>
              <p className="text-muted">{order.deliveryAddress.addressLine}</p>
              <p className="text-muted">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </p>
              <p className="text-muted mt-1">Phone: {order.deliveryAddress.phone}</p>
            </div>
          )}

          {/* Next Steps & CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/account/orders" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                VIEW IN MY ORDERS &rarr;
              </Button>
            </Link>
            <Link to="/shop" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                CONTINUE SHOPPING
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Pending Payment State
  if (paymentStatus === 'PENDING') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        <Breadcrumbs
          items={[
            { label: 'Checkout', href: '/checkout' },
            { label: 'Verification Pending' },
          ]}
          className="mb-6"
        />

        <div className="max-w-xl mx-auto bg-background border border-border p-8 rounded text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Clock className="w-8 h-8" />
          </div>

          <span className="editorial-badge text-amber-800 bg-amber-50 border border-amber-200">
            Awaiting Confirmation
          </span>

          <h1 className="text-2xl font-light text-foreground mt-2 tracking-tight">
            Payment is Being Verified
          </h1>

          <p className="text-xs sm:text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
            Cashfree is currently processing your transaction with your bank. This status typically updates
            within a few moments. If the payment was completed from your bank, your order will confirm automatically.
          </p>

          {order && (
            <div className="mt-6 p-4 bg-surface border border-border text-xs text-left max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Order ID:</span>
                <span className="font-mono font-semibold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount:</span>
                <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleRecheck}
              isLoading={isRechecking}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span>RECHECK PAYMENT STATUS</span>
            </Button>
            <Link to="/account/orders" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                VIEW MY ORDERS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Failed / Cancelled State
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
      <Breadcrumbs
        items={[
          { label: 'Checkout', href: '/checkout' },
          { label: 'Payment Incomplete' },
        ]}
        className="mb-6"
      />

      <div className="max-w-xl mx-auto bg-background border border-border p-8 rounded text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="editorial-badge text-rose-800 bg-rose-50 border border-rose-200">
          Transaction Incomplete
        </span>

        <h1 className="text-2xl font-light text-foreground mt-2 tracking-tight">
          Payment was not completed
        </h1>

        <p className="text-xs sm:text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
          {errorMessage ||
            'The payment attempt was not completed or was cancelled at the gateway. Your cart items have been preserved.'}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/checkout" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full">
              TRY PAYMENT AGAIN &rarr;
            </Button>
          </Link>
          <Link to="/cart" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              RETURN TO CART
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

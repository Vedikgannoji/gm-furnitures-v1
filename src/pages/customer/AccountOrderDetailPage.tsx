import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, Printer, Truck, MapPin, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/commerce/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/context/SettingsContext'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/api'

interface OrderItem {
  id?: string
  productId?: string
  name: string
  sku?: string
  slug?: string
  image?: string
  images?: string[]
  price: number
  quantity: number
  selectedColor?: string
}

interface DatabaseOrder {
  id: string
  orderNumber: string
  subtotal: number
  discount: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  couponCode?: string | null
  couponDiscountType?: string | null
  couponDiscountValue?: number | null
  couponDiscountAmount?: number
  deliveryAddress: {
    fullName?: string
    phone?: string
    address?: string
    addressLine?: string
    city?: string
    state?: string
    postalCode?: string
    pincode?: string
  }
  items: OrderItem[]
  createdAt: string
  assemblyCharge?: number
  convenienceFee?: number
  gst?: number
  gstPercent?: number
}

export const AccountOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const { settings } = useSettings()
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [order, setOrder] = useState<DatabaseOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadOrder() {
      if (!id || !token) return
      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setOrder(data)
        } else {
          if (isMounted) setError('Order could not be found.')
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load order.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadOrder()
    return () => {
      isMounted = false
    }
  }, [id, token])

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted mb-2" />
        <span className="text-xs text-muted">Retrieving order details from database...</span>
      </div>
    )
  }

  if (!order || error) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Package}
          title="Order Not Found"
          description="The requested order records could not be retrieved from the database."
          actionLabel="View All Orders"
          actionHref="/account/orders"
        />
      </div>
    )
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Derive fulfillment milestones based on real database status
  const statuses = ['pending', 'confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']
  const currentIdx = statuses.indexOf((order.status || '').toLowerCase().trim())
  const activeIdx = currentIdx >= 0 ? currentIdx : 0

  const timeline = [
    {
      status: 'Order Placed',
      description: 'Your order was verified and logged into our system.',
      completed: activeIdx >= 0,
    },
    {
      status: 'Order Confirmed',
      description: 'Payment confirmed; handcrafted production scheduled in our atelier.',
      completed: activeIdx >= 1,
    },
    {
      status: 'Dispatched for Delivery',
      description: 'Your furniture has been packed with protective wrap and dispatched.',
      completed: activeIdx >= 2,
    },
    {
      status: 'In Transit',
      description: 'En route with our specialized logistics transit fleet.',
      completed: activeIdx >= 3,
    },
    {
      status: 'Out for Delivery',
      description: 'Arriving at your doorstep with our white-glove delivery personnel.',
      completed: activeIdx >= 4,
    },
    {
      status: 'Delivered & Assembled',
      description: 'Delivery and complimentary assembly completed successfully.',
      completed: activeIdx >= 5,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Top back link & title */}
      <div>
        <Link
          to="/account/orders"
          className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="editorial-badge text-muted">Order Details</span>
            <h1 className="text-2xl font-light text-foreground mt-1">
              Order {order.orderNumber}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Placed on {orderDate} • Paid via {order.paymentMethod?.replace('_', ' ').toUpperCase()}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceOpen(true)}
            className="flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View GST Invoice</span>
          </Button>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-background border border-border p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-6">
          Milestone Fulfillment Tracker
        </h3>

        <div className="relative pl-6 sm:pl-8 border-l border-border space-y-6">
          {timeline.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-background ${
                  step.completed
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-transparent'
                }`}
              >
                {step.completed && <CheckCircle2 className="w-3 h-3 text-background" />}
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {step.status}
                  </h4>
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 bg-background border border-border p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-3 border-b border-border">
            Ordered Items
          </h3>

          <div className="divide-y divide-border">
            {order.items.map((item, idx) => {
              const imageSrc = item.image || item.images?.[0]
              return (
                <div key={idx} className="py-4 flex gap-4 items-center justify-between">
                  <div className="flex gap-3 items-center">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.name}
                        className="w-14 h-16 object-cover border border-border shrink-0 bg-surface"
                      />
                    ) : (
                      <div className="w-14 h-16 border border-border shrink-0 bg-surface flex items-center justify-center text-muted">
                        <Package className="w-4 h-4 stroke-[1.2]" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-medium text-foreground">{item.name}</h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Finish: {item.selectedColor || 'Standard'} • Qty: {item.quantity}
                      </p>
                      {item.sku && <p className="text-[10px] text-muted font-mono mt-0.5">SKU: {item.sku}</p>}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Product Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>

            {order.assemblyCharge !== undefined && order.assemblyCharge > 0 && (
              <div className="flex justify-between text-muted">
                <span>Assembly Charge</span>
                <span className="font-semibold text-foreground">{formatCurrency(order.assemblyCharge)}</span>
              </div>
            )}

            {order.convenienceFee !== undefined && order.convenienceFee > 0 && (
              <div className="flex justify-between text-muted">
                <span>Convenience Fee</span>
                <span className="font-semibold text-foreground">{formatCurrency(order.convenienceFee)}</span>
              </div>
            )}

            {order.gst !== undefined && order.gst > 0 && (
              <div className="flex justify-between text-muted">
                <span>GST on Convenience Fee</span>
                <span className="font-semibold text-foreground">{formatCurrency(order.gst)}</span>
              </div>
            )}

            {order.couponDiscountAmount && order.couponDiscountAmount > 0 ? (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
                <span>-{formatCurrency(order.couponDiscountAmount)}</span>
              </div>
            ) : null}

            <div className="pt-2 border-t border-border flex justify-between items-baseline">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Total Paid
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address & Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-background border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Delivery Address
              </h3>
            </div>
            <div className="text-xs text-muted space-y-1">
              <p className="font-semibold text-foreground">{order.deliveryAddress?.fullName}</p>
              <p>{order.deliveryAddress?.addressLine}</p>
              <p>
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.postalCode}
              </p>
              {order.deliveryAddress?.phone && (
                <p className="pt-1 text-foreground">Phone: {order.deliveryAddress.phone}</p>
              )}
            </div>
          </div>

          <div className="bg-background border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Delivery & Assembly
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Standard white-glove transit includes doorstep offloading, unpackaging, and assembly by GM certified carpentry technicians.
            </p>
          </div>
        </div>
      </div>

      {/* GST Invoice Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title={`Tax Invoice — ${order.orderNumber}`}
        maxWidth="2xl"
      >
        <div className="p-6 bg-white text-black text-xs font-sans space-y-6 print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider">{settings.storeName}</h2>
              <p className="text-zinc-600 mt-1">{settings.brandTagline || 'GM Group of Interiors & Constructions'}</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">{settings.registeredAddress || 'Registered Office, India'}</p>
              <p className="text-zinc-500 text-[11px]">GSTIN: {settings.gstin || 'Unregistered'}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-zinc-100 text-zinc-800 text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                TAX INVOICE
              </span>
              <p className="text-xs font-bold text-zinc-900 mt-2">Inv #: {order.orderNumber}</p>
              <p className="text-zinc-500 text-[11px]">Date: {orderDate}</p>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-200 text-xs">
            <div>
              <p className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Billed To:</p>
              <p className="font-semibold mt-1">{order.deliveryAddress?.fullName}</p>
              <p className="text-zinc-600">{order.deliveryAddress?.addressLine}</p>
              <p className="text-zinc-600">{order.deliveryAddress?.city}, {order.deliveryAddress?.state}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Payment Mode:</p>
              <p className="font-semibold uppercase mt-1">{order.paymentMethod?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-300 text-zinc-600 text-[10px] uppercase tracking-wider bg-zinc-50">
                <th className="p-2">Item Description</th>
                <th className="p-2 text-center">HSN</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2">
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-[10px] text-zinc-500">Finish: {it.selectedColor || 'Natural'} • SKU: {it.sku || 'N/A'}</p>
                  </td>
                  <td className="p-2 text-center font-mono text-[11px]">94036000</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right">{formatCurrency(it.price)}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-300 flex justify-between font-bold text-sm text-black">
                <span>Total Amount</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-between items-center text-[10px] text-zinc-500">
            <span>Computer generated GST document. Handcrafted by GM Furniture.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              <span>Print Invoice</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

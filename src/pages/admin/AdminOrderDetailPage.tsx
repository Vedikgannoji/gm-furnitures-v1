import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  User,
  MapPin,
  CreditCard,
  History,
  ShieldCheck,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'

interface StatusHistoryItem {
  id: string
  oldStatus: string
  newStatus: string
  changedBy: string
  changedAt: string
}

interface AdminOrderItem {
  id?: string
  productId?: string
  name: string
  sku?: string
  slug?: string
  price: number
  quantity: number
  lineTotal?: number
  selectedColor?: string
  material?: string
  finish?: string
  image?: string
  images?: string[]
}

interface AdminOrderDetail {
  id: string
  orderNumber: string
  date: string
  createdAt: string
  updatedAt?: string
  status: OrderStatus
  paymentStatus: string
  paymentGateway?: string
  paymentOrderId?: string | null
  paymentTransactionId?: string | null
  paidAt?: string | null
  customer: {
    id?: string
    name: string
    email: string
    phone?: string
  }
  deliveryAddress: {
    fullName?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    pinCode?: string
    addressType?: string
  }
  items: AdminOrderItem[]
  pricing: {
    subtotal: number
    assemblyCharge: number
    convenienceFee: number
    gst: number
    couponCode?: string | null
    couponDiscountType?: string | null
    couponDiscountValue?: number | null
    couponDiscountAmount?: number
    discount: number
    total: number
  }
  statusHistory?: StatusHistoryItem[]
}

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
]

function getStatusBadge(status: string) {
  const norm = (status || '').toLowerCase().trim()
  switch (norm) {
    case 'delivered':
      return { label: 'Delivered', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    case 'out_for_delivery':
      return { label: 'Out for Delivery', style: 'bg-cyan-50 text-cyan-800 border-cyan-200' }
    case 'in_transit':
      return { label: 'In Transit', style: 'bg-purple-50 text-purple-800 border-purple-200' }
    case 'shipped':
      return { label: 'Shipped', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
    case 'confirmed':
      return { label: 'Confirmed', style: 'bg-blue-50 text-blue-800 border-blue-200' }
    case 'pending':
    default:
      return { label: 'Pending', style: 'bg-amber-50 text-amber-800 border-amber-200' }
  }
}

function getPaymentBadge(status: string) {
  const norm = (status || '').toLowerCase().trim()
  switch (norm) {
    case 'paid':
    case 'success':
      return { label: 'Paid', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'failed':
      return { label: 'Failed', style: 'bg-rose-50 text-rose-700 border-rose-200' }
    case 'pending':
    default:
      return { label: 'Pending', style: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
}

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { token } = useAuth()
  const { settings } = useSettings()

  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const fetchOrderDetail = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Order not found.')
      }
      const data: AdminOrderDetail = await res.json()
      setOrder(data)
      setSelectedStatus(data.status || 'pending')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load order.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetail()
  }, [id, token])

  const handleStatusUpdate = async () => {
    if (!order) return
    try {
      setIsUpdating(true)
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: selectedStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update order status.')

      showToast(
        'Order Status Updated',
        `Order ${order.orderNumber} transitioned to ${selectedStatus.toUpperCase()}.`,
        'success'
      )
      // Refetch to refresh status history log from PostgreSQL
      await fetchOrderDetail()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed.'
      showToast('Update Failed', message, 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs text-muted">Retrieving order details from PostgreSQL...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Link to="/admin/orders" className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
        <div className="p-5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || 'Order record not found.'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
          Return to Orders
        </Button>
      </div>
    )
  }

  const orderBadge = getStatusBadge(order.status)
  const paymentBadge = getPaymentBadge(order.paymentStatus)
  const invoiceNumber = `INV-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.replace('GM-', '')}`

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Top Nav & Order Identification */}
      <div>
        <Link to="/admin/orders" className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-badge text-muted">Order Management</span>
              <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border ${orderBadge.style}`}>
                {orderBadge.label}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border ${paymentBadge.style}`}>
                Payment: {paymentBadge.label}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
              Order {order.orderNumber}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Placed on {order.date} • Recorded permanently in Neon PostgreSQL
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 self-start"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Preview GST Invoice</span>
          </Button>
        </div>
      </div>

      {/* Fulfillment Status Management Toolbar */}
      <div className="bg-surface border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
            Update Fulfillment Status
          </span>
          <p className="text-xs text-foreground mt-0.5">
            Current status: <span className="font-bold uppercase font-mono">{orderBadge.label}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
            className="h-9 px-3 bg-background border border-border text-xs focus:border-foreground focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleStatusUpdate}
            isLoading={isUpdating}
            className="flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Status</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Items & Pricing Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* ORDER ITEMS with Actual Historical Snapshot Images */}
          <div className="bg-background border border-border p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center justify-between">
              <span>Order Items ({order.items.length})</span>
              <span className="text-[10px] text-muted font-normal">Immutable Historical Snapshot</span>
            </h3>

            <div className="divide-y divide-border">
              {order.items.map((it, idx) => {
                const imageSrc = it.image || it.images?.[0]
                const lineTotal = it.lineTotal ?? it.price * it.quantity

                return (
                  <div key={idx} className="py-4 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={it.name}
                          className="w-14 h-16 object-cover border border-border shrink-0 bg-surface"
                        />
                      ) : (
                        <div className="w-14 h-16 border border-border shrink-0 bg-surface flex items-center justify-center text-muted">
                          <Package className="w-4 h-4 stroke-[1.2]" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-foreground block">{it.name}</span>
                        <div className="text-muted text-[11px] space-y-0.5 mt-0.5">
                          {it.selectedColor && <span>Color: {it.selectedColor} • </span>}
                          {it.material && <span>Material: {it.material} • </span>}
                          {it.finish && <span>Finish: {it.finish} • </span>}
                          {it.sku && <span className="font-mono">SKU: {it.sku}</span>}
                        </div>
                        <span className="text-[11px] text-muted block mt-0.5">
                          Qty: {it.quantity} × {formatCurrency(it.price)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-foreground block font-mono">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* PRICE SUMMARY */}
          <div className="bg-background border border-border p-6 space-y-3 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Price Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-muted">
                <span>Product Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(order.pricing.subtotal)}</span>
              </div>

              {order.pricing.assemblyCharge > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Assembly Charge</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.pricing.assemblyCharge)}</span>
                </div>
              )}

              {order.pricing.convenienceFee > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Convenience Fee</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.pricing.convenienceFee)}</span>
                </div>
              )}

              {order.pricing.gst > 0 && (
                <div className="flex justify-between text-muted">
                  <span>GST on Convenience Fee</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.pricing.gst)}</span>
                </div>
              )}

              {order.pricing.couponDiscountAmount && order.pricing.couponDiscountAmount > 0 ? (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Coupon Discount ({order.pricing.couponCode || 'APPLIED'})
                    {order.pricing.couponDiscountType === 'percent' && order.pricing.couponDiscountValue
                      ? ` [${order.pricing.couponDiscountValue}%]`
                      : ''}
                  </span>
                  <span>-{formatCurrency(order.pricing.couponDiscountAmount)}</span>
                </div>
              ) : null}

              <div className="pt-3 border-t border-border flex justify-between items-baseline font-bold text-sm text-foreground">
                <span className="uppercase tracking-wider">Final Total</span>
                <span className="text-base text-foreground font-mono">{formatCurrency(order.pricing.total)}</span>
              </div>
            </div>
          </div>

          {/* STATUS HISTORY LOG */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-background border border-border p-6 space-y-3 text-xs">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-muted" />
                <span>Status Transition History</span>
              </h3>

              <div className="divide-y divide-border">
                {order.statusHistory.map((sh) => (
                  <div key={sh.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-foreground uppercase tracking-wider text-[11px]">
                        {sh.oldStatus} &rarr; {sh.newStatus}
                      </span>
                      <span className="text-muted block text-[10px] mt-0.5">
                        Updated by {sh.changedBy}
                      </span>
                    </div>
                    <span className="text-muted text-[11px]">
                      {new Date(sh.changedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer Details, Delivery Address & Payment Details */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* CUSTOMER DETAILS */}
          <div className="bg-background border border-border p-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted" />
              <span>Customer Details</span>
            </h3>

            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-muted uppercase tracking-wider block">Customer Name</span>
                <p className="font-semibold text-foreground">{order.customer.name}</p>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-muted uppercase tracking-wider block">Email</span>
                <p className="text-foreground">{order.customer.email || 'Not provided'}</p>
              </div>
              {order.customer.phone && (
                <div className="pt-1">
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Phone</span>
                  <p className="text-foreground">{order.customer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* DELIVERY ADDRESS */}
          <div className="bg-background border border-border p-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted" />
              <span>Delivery Address</span>
            </h3>

            <div className="space-y-1 text-muted">
              <p className="font-semibold text-foreground">
                {order.deliveryAddress.fullName || order.customer.name}
              </p>
              {order.deliveryAddress.phone && <p>Phone: {order.deliveryAddress.phone}</p>}
              {order.deliveryAddress.address && <p>{order.deliveryAddress.address}</p>}
              <p>
                {[order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pinCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {order.deliveryAddress.addressType && (
                <p className="text-[10px] uppercase tracking-wider pt-1 text-muted">
                  Type: {order.deliveryAddress.addressType}
                </p>
              )}
            </div>
          </div>

          {/* PAYMENT DETAILS (No Secret Credentials Exposed) */}
          <div className="bg-background border border-border p-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted" />
              <span>Payment Details</span>
            </h3>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-muted uppercase tracking-wider block">Gateway</span>
                <p className="font-medium text-foreground uppercase">
                  {order.paymentGateway || 'Cashfree'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-muted uppercase tracking-wider block">Payment Status</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border ${paymentBadge.style}`}>
                  {paymentBadge.label}
                </span>
              </div>

              {order.paymentOrderId && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Cashfree Order ID</span>
                  <p className="font-mono text-[11px] text-foreground break-all">{order.paymentOrderId}</p>
                </div>
              )}

              {order.paymentTransactionId && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Transaction Reference</span>
                  <p className="font-mono text-[11px] text-foreground break-all">{order.paymentTransactionId}</p>
                </div>
              )}

              {order.paidAt && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Payment Date</span>
                  <p className="text-muted text-[11px]">
                    {new Date(order.paidAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GST Tax Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="GST Tax Invoice Preview"
        maxWidth="2xl"
      >
        <div className="p-4 bg-white text-zinc-900 border border-zinc-200 text-xs space-y-6">
          <div className="flex justify-between items-start pb-4 border-b border-zinc-200">
            <div>
              <h2 className="text-base font-bold tracking-widest uppercase text-black">{settings.storeName}</h2>
              <p className="text-[11px] text-zinc-500 mt-1">{settings.registeredAddress}</p>
              <p className="text-[11px] font-mono text-zinc-500">GSTIN: {settings.gstin}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold block text-black">{invoiceNumber}</span>
              <span className="text-[11px] text-zinc-500 block">Date: {order.date}</span>
              <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase ${
                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">Billed To:</span>
              <p className="font-semibold mt-1">{order.customer.name}</p>
              <p className="text-zinc-600">{order.customer.email}</p>
              {order.deliveryAddress?.city && (
                <p className="text-zinc-600">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
              )}
            </div>
            <div className="text-right">
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">Tax Classification:</span>
              <p className="text-zinc-600 mt-1">HSN 94036000 (Wooden Furniture)</p>
              <p className="text-zinc-600">CGST + SGST @ 18%</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase text-zinc-500">
                <th className="p-2">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.quantity}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(it.price)}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-2 border-t border-zinc-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(order.pricing.subtotal)}</span>
              </div>
              {order.pricing.couponDiscountAmount && order.pricing.couponDiscountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-{formatCurrency(order.pricing.couponDiscountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-black font-bold pt-1 border-t border-zinc-200">
                <span>Total Invoice Value:</span>
                <span className="font-mono">{formatCurrency(order.pricing.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

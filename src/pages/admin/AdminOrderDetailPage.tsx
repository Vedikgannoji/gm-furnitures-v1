import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Printer, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'

type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface AdminOrderDetail {
  id: string
  orderNumber: string
  date: string
  createdAt: string
  customer: { id: string; name: string; email: string }
  items: Array<{
    productId: string
    name: string
    sku: string
    price: number
    quantity: number
    selectedColor?: string
    image?: string
  }>
  subtotal: number
  discount: number
  total: number
  status: OrderStatus
  deliveryAddress: {
    fullName?: string
    addressLine?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
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
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('confirmed')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function load() {
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
        const data = await res.json()
        if (isMounted) {
          setOrder(data)
          setSelectedStatus(data.status)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load order.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
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
      if (!res.ok) throw new Error(data.error || 'Failed to update status.')
      setOrder((prev) => prev ? { ...prev, status: selectedStatus } : prev)
      showToast('Order Updated', `${order.orderNumber} → ${selectedStatus}.`, 'success')
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs text-muted">Loading order from database...</span>
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
          <span>{error || 'Order not found.'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
          Return to Orders
        </Button>
      </div>
    )
  }

  const tax = Math.round(order.subtotal * 0.18)
  const invoiceNumber = `INV-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.replace('GM-', '')}`

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top nav */}
      <div>
        <Link to="/admin/orders" className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="editorial-badge text-muted">Order Management</span>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
              Order {order.orderNumber}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Client: {order.customer.name} ({order.customer.email}) • Placed: {order.date}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(true)} className="flex items-center gap-1.5 self-start">
            <FileText className="w-3.5 h-3.5" />
            <span>Preview GST Invoice</span>
          </Button>
        </div>
      </div>

      {/* Status control */}
      <div className="bg-surface border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">Fulfillment Stage</span>
          <p className="text-xs text-foreground mt-0.5">
            Current: <span className="font-bold uppercase font-mono">{order.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
            className="h-9 px-3 bg-background border border-border text-xs focus:border-foreground focus:outline-none cursor-pointer"
          >
            <option value="confirmed">Confirmed (Payment Received)</option>
            <option value="processing">In Production & Joinery QC</option>
            <option value="shipped">Dispatched with Freight Crew</option>
            <option value="delivered">Delivered & Assembled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="primary" size="sm" onClick={handleStatusUpdate} isLoading={isUpdating}>
            Update Stage
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items & Financials */}
        <div className="lg:col-span-8 bg-background border border-border p-6 space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
            Ordered Items ({order.items.length})
          </h3>

          <div className="divide-y divide-border">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  {it.image ? (
                    <img src={it.image} alt={it.name} className="w-12 h-14 object-cover border border-border shrink-0 bg-surface" />
                  ) : (
                    <div className="w-12 h-14 border border-border shrink-0 bg-surface" />
                  )}
                  <div>
                    <span className="font-semibold text-foreground block">{it.name}</span>
                    <span className="text-muted block mt-0.5">
                      {it.selectedColor ? `Finish: ${it.selectedColor} • ` : ''}SKU: {it.sku}
                    </span>
                    <span className="text-[11px] text-muted block">Qty: {it.quantity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground block">{formatCurrency(it.price * it.quantity)}</span>
                  <span className="text-[11px] text-muted">({formatCurrency(it.price)} each)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Taxable Value (Pre-GST)</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>CGST (9%)</span>
              <span className="font-semibold text-foreground">{formatCurrency(Math.round(tax / 2))}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>SGST (9%)</span>
              <span className="font-semibold text-foreground">{formatCurrency(Math.round(tax / 2))}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping & Assembly</span>
              <span className="font-semibold text-emerald-700">COMPLIMENTARY</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-baseline font-bold text-sm text-foreground">
              <span>Total Invoice Value</span>
              <span className="text-base">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery */}
        <div className="lg:col-span-4 bg-background border border-border p-6 space-y-4 text-xs">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
            Client & Site Details
          </h3>
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wider block">Customer</span>
            <p className="font-semibold text-foreground mt-0.5">{order.customer.name}</p>
            <p className="text-muted">{order.customer.email}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <span className="text-[10px] text-muted uppercase tracking-wider block">Delivery Address</span>
            {order.deliveryAddress?.addressLine ? (
              <>
                <p className="text-muted mt-0.5">{order.deliveryAddress.fullName || order.customer.name}</p>
                <p className="text-muted">{order.deliveryAddress.addressLine}</p>
                <p className="text-muted">
                  {[order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode]
                    .filter(Boolean).join(', ')}
                </p>
                {order.deliveryAddress.phone && <p className="text-muted">{order.deliveryAddress.phone}</p>}
              </>
            ) : (
              <p className="text-muted mt-0.5 italic">Address not recorded</p>
            )}
          </div>
          <div className="pt-2 border-t border-border">
            <span className="text-[10px] text-muted uppercase tracking-wider block">Order Placed</span>
            <p className="font-semibold text-foreground mt-0.5">{order.date}</p>
          </div>
        </div>
      </div>

      {/* GST Invoice Modal */}
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
              <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-600">
                <th className="p-2">Item</th>
                <th className="p-2 text-center">HSN</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2">{it.name}{it.selectedColor ? ` (${it.selectedColor})` : ''}</td>
                  <td className="p-2 text-center font-mono">94036000</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between"><span>Taxable Amount</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>CGST (9%)</span><span>{formatCurrency(Math.round(tax / 2))}</span></div>
              <div className="flex justify-between"><span>SGST (9%)</span><span>{formatCurrency(Math.round(tax / 2))}</span></div>
              <div className="flex justify-between font-bold border-t border-zinc-300 pt-1 text-sm text-black">
                <span>Grand Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1">
              <Printer className="w-3 h-3" />
              <span>Print Invoice</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

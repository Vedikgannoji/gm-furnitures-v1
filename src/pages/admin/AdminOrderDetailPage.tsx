import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, Printer, Truck, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockOrders } from '@/data/mockData'
import { OrderStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()

  const initialOrder = mockOrders.find((o) => o.id === id) || mockOrders[0]
  const [order, setOrder] = useState(initialOrder)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const handleStatusUpdate = () => {
    setOrder((prev) => ({
      ...prev,
      status: selectedStatus,
      timeline: [
        ...prev.timeline,
        {
          status: `Marked as ${selectedStatus.toUpperCase()}`,
          date: 'Just now',
          description: `Admin updated order milestone to ${selectedStatus}`,
          completed: true,
          current: true,
        },
      ],
    }))
    showToast('Order Status Updated', `Order ${order.orderNumber} updated to ${selectedStatus}.`, 'success')
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top back link */}
      <div>
        <Link
          to="/admin/orders"
          className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
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

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview GST Invoice</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Switcher Action Card */}
      <div className="bg-surface border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
            Fulfillment Stage Control
          </span>
          <p className="text-xs text-foreground mt-0.5">
            Current Stage: <span className="font-bold uppercase font-mono">{order.status}</span>
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
          <Button variant="primary" size="sm" onClick={handleStatusUpdate}>
            Update Stage
          </Button>
        </div>
      </div>

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Products & Financial Breakdown */}
        <div className="lg:col-span-8 bg-background border border-border p-6 space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
            Commissioned Furniture Pieces ({order.items.length})
          </h3>

          <div className="divide-y divide-border">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="w-12 h-14 object-cover border border-border shrink-0 bg-surface"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">{it.name}</span>
                    <span className="text-muted block mt-0.5">
                      Finish: {it.selectedColor} • SKU: {it.sku}
                    </span>
                    <span className="text-[11px] text-muted block">Quantity: {it.quantity}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-foreground block">
                    {formatCurrency(it.price * it.quantity)}
                  </span>
                  <span className="text-[11px] text-muted">
                    ({formatCurrency(it.price)} each)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Taxable Value</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>CGST (9%)</span>
              <span className="font-semibold text-foreground">{formatCurrency(Math.round(order.tax / 2))}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>SGST (9%)</span>
              <span className="font-semibold text-foreground">{formatCurrency(Math.round(order.tax / 2))}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>White-Glove Shipping & Assembly</span>
              <span className="font-semibold text-emerald-700">
                {order.shipping === 0 ? 'COMPLIMENTARY' : formatCurrency(order.shipping)}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-baseline font-bold text-sm text-foreground">
              <span>Total Gross Invoice Value</span>
              <span className="text-base">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Right: Customer & Delivery Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-background border border-border p-6 space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Client & Site Details
            </h3>

            <div>
              <span className="text-[10px] text-muted uppercase tracking-wider block">Customer</span>
              <p className="font-semibold text-foreground mt-0.5">{order.customer.name}</p>
              <p className="text-muted">{order.customer.email}</p>
              <p className="text-muted">{order.customer.phone}</p>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-[10px] text-muted uppercase tracking-wider block">
                Delivery Site
              </span>
              <p className="text-muted mt-0.5">{order.shippingAddress.streetAddress}</p>
              {order.shippingAddress.apartment && <p className="text-muted">{order.shippingAddress.apartment}</p>}
              <p className="text-muted">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-[10px] text-muted uppercase tracking-wider block">
                Payment Verification
              </span>
              <p className="font-semibold text-emerald-700 mt-0.5">
                Paid In Full ({order.paymentMethod.replace('_', ' ').toUpperCase()})
              </p>
            </div>
          </div>

          {/* Timeline tracker */}
          <div className="bg-background border border-border p-6 text-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Activity History
            </h3>

            <div className="relative pl-5 border-l border-border space-y-4">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[25px] top-0.5 w-3 h-3 rounded-full border ${
                      step.completed ? 'bg-foreground border-foreground' : 'bg-background border-border'
                    }`}
                  />
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                    {step.status}
                  </p>
                  <p className="text-[10px] text-muted">{step.date}</p>
                  <p className="text-[11px] text-muted mt-0.5">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GST Invoice Modal Preview */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Admin GST Tax Invoice View"
        maxWidth="2xl"
      >
        <div className="p-4 bg-white text-zinc-900 border border-zinc-200 text-xs space-y-6">
          <div className="flex justify-between items-start pb-4 border-b border-zinc-200">
            <div>
              <h2 className="text-base font-bold tracking-widest uppercase text-black">
                GM FURNITURE ATELIER
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">Sector 44, Institutional Area, Gurugram, HR 122003</p>
              <p className="text-[11px] font-mono text-zinc-500">GSTIN: 06AAACG1234F1Z8</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold block text-black">
                INV-2026-{order.orderNumber.replace('GMF-', '')}
              </span>
              <span className="text-[11px] text-zinc-500 block">Date: {order.date}</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                PAID
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">
                Billed To:
              </span>
              <p className="font-semibold mt-1">{order.customer.name}</p>
              <p className="text-zinc-600">{order.shippingAddress.streetAddress}</p>
              <p className="text-zinc-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">
                Tax Code:
              </span>
              <p className="text-zinc-600 mt-1">HSN 94036000 (Wooden Furniture)</p>
              <p className="text-zinc-600">Interstate IGST / CGST+SGST Compliant</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-zinc-200 text-xs">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-600">
                <th className="p-2">Item</th>
                <th className="p-2 text-center">HSN</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Taxable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2">{it.name} ({it.selectedColor})</td>
                  <td className="p-2 text-center font-mono">94036000</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total GST (18%)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-zinc-300 pt-1 text-sm text-black">
                <span>Grand Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              <span>Print Tax Invoice</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Clock, FileText, Printer, Truck, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockOrders } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

export const AccountOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)

  const order = mockOrders.find((o) => o.id === id) || mockOrders[0]

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
              Placed on {order.date} • Paid via {order.paymentMethod.replace('_', ' ').toUpperCase()}
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
          {order.timeline.map((step, idx) => (
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
                  <span className="text-[11px] text-muted">{step.date}</span>
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
            {order.items.map((item, idx) => (
              <div key={idx} className="py-4 flex gap-4 items-center justify-between">
                <div className="flex gap-3 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-16 object-cover border border-border shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-medium text-foreground">{item.name}</h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      Finish: {item.selectedColor} • Qty: {item.quantity}
                    </p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">SKU: {item.sku}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>GST Tax (18%)</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery & Assembly</span>
              <span className="font-semibold text-emerald-700">
                {order.shipping === 0 ? 'COMPLIMENTARY' : formatCurrency(order.shipping)}
              </span>
            </div>
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

        {/* Shipping Destination */}
        <div className="lg:col-span-4 bg-surface border border-border p-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
            Delivery Destination
          </h3>

          <div className="text-xs space-y-1 text-muted">
            <p className="font-semibold text-foreground">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.streetAddress}</p>
            {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
            <p className="pt-2 text-[11px] font-mono">Mobile: {order.shippingAddress.phone}</p>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-foreground mb-1">
              Delivery Status
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Our regional delivery crew will coordinate the appointment 24 hours prior to final arrival.
            </p>
          </div>
        </div>
      </div>

      {/* Formal Tax Invoice Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Tax Invoice"
        description="Tax Invoice for Furniture Order"
        maxWidth="2xl"
      >
        <div className="p-4 bg-white text-zinc-900 border border-zinc-200 text-xs space-y-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start pb-4 border-b border-zinc-200">
            <div>
              <h2 className="text-base font-bold tracking-widest uppercase text-black">
                GM FURNITURE ATELIER
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">Sector 44, Institutional Area, Gurugram, HR 122003</p>
              <p className="text-[11px] font-mono text-zinc-500">GSTIN: 36AFNPV7079J1ZG</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold block text-black">
                INV-2026-{order.orderNumber.replace('GMF-', '')}
              </span>
              <span className="text-[11px] text-zinc-500 block">Date: {order.date}</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                PAID IN FULL
              </span>
            </div>
          </div>

          {/* Billed to */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">
                Billed & Shipped To:
              </span>
              <p className="font-semibold mt-1">{order.customer.name}</p>
              <p className="text-zinc-600">{order.shippingAddress.streetAddress}</p>
              <p className="text-zinc-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
              <p className="text-zinc-600">{order.customer.phone}</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">
                Place of Supply:
              </span>
              <p className="mt-1">{order.shippingAddress.state}, India</p>
              <p className="text-zinc-600">HSN Code: 94036000 (Wooden Furniture)</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-zinc-200 text-xs">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-600">
                <th className="p-2">Item Description</th>
                <th className="p-2 text-center">HSN</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">Taxable Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2">
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-[10px] text-zinc-500">Finish: {it.selectedColor} • SKU: {it.sku}</p>
                  </td>
                  <td className="p-2 text-center font-mono text-[11px]">94036000</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right">{formatCurrency(it.price)}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (9.0%)</span>
                <span>{formatCurrency(Math.round(order.tax / 2))}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (9.0%)</span>
                <span>{formatCurrency(Math.round(order.tax / 2))}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Assembly</span>
                <span>{order.shipping === 0 ? '₹0.00' : formatCurrency(order.shipping)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-300 flex justify-between font-bold text-sm text-black">
                <span>Total Amount</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-between items-center text-[10px] text-zinc-500">
            <span>This is a computer generated invoice requiring no physical signature.</span>
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

import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Search, Eye, RefreshCw, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'

/**
 * Invoices are derived from real orders in the database.
 * An invoice is generated for every order that has been placed.
 * The GSTIN and business details come dynamically from Store Settings in PostgreSQL.
 */
interface InvoiceRecord {
  id: string
  invoiceNumber: string
  orderNumber: string
  customerName: string
  customerEmail: string
  date: string
  taxableAmount: number
  cgst: number
  sgst: number
  totalAmount: number
  status: string
  deliveryAddress?: any
  items?: any[]
}

export const AdminInvoicesPage: React.FC = () => {
  const { token } = useAuth()
  const { settings } = useSettings()
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null)

  const storeGstin = settings.gstin || '36AFNPV7079J1ZG'
  const storeName = settings.storeName || 'GM FURNITURE'
  const storeAddr = settings.registeredAddress || 'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India'

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Invoices are derived from real orders
      const res = await fetch('/api/admin/orders', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to load orders.')
      }
      const orders: any[] = await res.json()

      // Build invoice records from real orders
      const built: InvoiceRecord[] = orders.map((o) => {
        const year = new Date(o.createdAt).getFullYear()
        const taxable = o.subtotal
        const gst = Math.round(taxable * 0.18)
        return {
          id: o.id,
          invoiceNumber: `INV-${year}-${o.orderNumber.replace('GM-', '')}`,
          orderNumber: o.orderNumber,
          customerName: o.customer.name,
          customerEmail: o.customer.email,
          date: o.date,
          taxableAmount: taxable,
          cgst: Math.round(gst / 2),
          sgst: Math.round(gst / 2),
          totalAmount: o.total,
          status: o.status === 'delivered' ? 'paid' : 'issued',
          deliveryAddress: o.deliveryAddress,
          items: o.items,
        }
      })
      setInvoices(built)
    } catch (err: any) {
      setError(err.message || 'Unable to connect to database.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Statutory Taxation</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            GST Tax Invoices Register
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Invoices generated from real customer orders. GSTIN: {storeGstin}.
          </p>
        </div>
        <button
          onClick={fetchInvoices}
          disabled={isLoading}
          className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-background border border-border p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search invoice number, client, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>
        {!isLoading && (
          <span className="text-xs text-muted shrink-0">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInvoices} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Table / Empty state */}
      <div className="bg-background border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-muted">Loading invoices...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-border mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {invoices.length === 0 ? 'No Invoices Yet' : 'No matching invoices'}
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {invoices.length === 0
                ? 'Invoices are generated automatically from customer orders. They will appear here once customers place orders.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Invoice No.</th>
                <th className="py-3 px-4 font-semibold">Order Ref</th>
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Taxable</th>
                <th className="py-3 px-4 font-semibold text-right">GST (18%)</th>
                <th className="py-3 px-4 font-semibold text-right">Total</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-mono text-muted">{inv.orderNumber}</td>
                  <td className="py-3 px-4 font-medium">
                    <span className="block">{inv.customerName}</span>
                    <span className="text-[10px] text-muted">{inv.customerEmail}</span>
                  </td>
                  <td className="py-3 px-4 text-muted">{inv.date}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(inv.taxableAmount)}</td>
                  <td className="py-3 px-4 text-right text-muted">{formatCurrency(inv.cgst + inv.sgst)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                      inv.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="inline-flex items-center gap-1 text-xs text-foreground font-medium hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice Preview Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title="Official GST Tax Invoice"
        maxWidth="2xl"
      >
        {previewInvoice && (
          <div className="p-6 bg-white text-zinc-900 border border-zinc-200 text-xs space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-zinc-200">
              <div>
                <h2 className="text-base font-bold tracking-widest uppercase text-black">{storeName}</h2>
                <p className="text-[11px] text-zinc-500 mt-1">{storeAddr}</p>
                <p className="text-[11px] font-mono text-zinc-500">GSTIN: {storeGstin}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold block text-black">{previewInvoice.invoiceNumber}</span>
                <span className="text-[11px] text-zinc-500 block">Date: {previewInvoice.date}</span>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase ${
                  previewInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {previewInvoice.status === 'paid' ? 'PAID IN FULL' : 'ISSUED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">Billed To:</span>
                <p className="font-semibold mt-1">{previewInvoice.customerName}</p>
                <p className="text-zinc-600">{previewInvoice.customerEmail}</p>
                <p className="text-zinc-600 mt-1">Order Ref: {previewInvoice.orderNumber}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">Classification:</span>
                <p className="text-zinc-600 mt-1">HSN 94036000 (Wooden Furniture)</p>
                <p className="text-zinc-600">CGST + SGST @ 18% Combined</p>
              </div>
            </div>

            {previewInvoice.items && previewInvoice.items.length > 0 && (
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
                  {previewInvoice.items.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2">{it.name}{it.selectedColor ? ` (${it.selectedColor})` : ''}</td>
                      <td className="p-2 text-center font-mono">94036000</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="bg-zinc-50 p-4 border border-zinc-200 space-y-2">
              <div className="flex justify-between"><span>Taxable Supply Value</span><span className="font-semibold">{formatCurrency(previewInvoice.taxableAmount)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Central GST (CGST @ 9%)</span><span>{formatCurrency(previewInvoice.cgst)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>State GST (SGST @ 9%)</span><span>{formatCurrency(previewInvoice.sgst)}</span></div>
              <div className="pt-2 border-t border-zinc-300 flex justify-between font-bold text-sm text-black">
                <span>Total Statutory Amount</span><span>{formatCurrency(previewInvoice.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-between items-center text-[10px] text-zinc-500">
              <span>Official document under Rule 48 of CGST Rules, 2017.</span>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

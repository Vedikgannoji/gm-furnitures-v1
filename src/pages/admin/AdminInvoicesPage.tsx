import React, { useState } from 'react'
import { FileText, Printer, Search, Eye, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockInvoices, mockStoreSettings } from '@/data/mockData'
import { Invoice } from '@/types'
import { formatCurrency } from '@/lib/utils'

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  const filteredInvoices = invoices.filter(
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
            Formal B2C and B2B GST tax invoices compliant with Indian HSN 94036000 provisions.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-background border border-border p-4 flex items-center justify-between">
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
        <span className="text-xs text-muted">
          {filteredInvoices.length} Invoices Registered
        </span>
      </div>

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Invoice No.</th>
              <th className="py-3 px-4 font-semibold">Order Ref</th>
              <th className="py-3 px-4 font-semibold">Client Name</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold text-right">Taxable</th>
              <th className="py-3 px-4 font-semibold text-right">GST (18%)</th>
              <th className="py-3 px-4 font-semibold text-right">Gross Total</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-foreground">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 font-mono text-muted">{inv.orderNumber}</td>
                <td className="py-3 px-4 font-medium">{inv.customerName}</td>
                <td className="py-3 px-4 text-muted">{inv.date}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(inv.taxableAmount)}</td>
                <td className="py-3 px-4 text-right text-muted">{formatCurrency(inv.cgst + inv.sgst)}</td>
                <td className="py-3 px-4 text-right font-semibold text-foreground">
                  {formatCurrency(inv.totalAmount)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
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
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title="Official GST Tax Invoice Preview"
        maxWidth="2xl"
      >
        {previewInvoice && (
          <div className="p-6 bg-white text-zinc-900 border border-zinc-200 text-xs space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-zinc-200">
              <div>
                <h2 className="text-base font-bold tracking-widest uppercase text-black">
                  {mockStoreSettings.storeName.toUpperCase()}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-1">{mockStoreSettings.registeredAddress}</p>
                <p className="text-[11px] font-mono text-zinc-500">GSTIN: {mockStoreSettings.gstin}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold block text-black">
                  {previewInvoice.invoiceNumber}
                </span>
                <span className="text-[11px] text-zinc-500 block">Date of Issue: {previewInvoice.date}</span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  PAID IN FULL
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">
                  Billed To Client:
                </span>
                <p className="font-semibold mt-1">{previewInvoice.customerName}</p>
                <p className="text-zinc-600">{previewInvoice.customerEmail}</p>
                <p className="text-zinc-600 mt-1">Order Ref: {previewInvoice.orderNumber}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 block">
                  Statutory Classification:
                </span>
                <p className="text-zinc-600 mt-1">HSN 94036000 (Wooden Furniture)</p>
                <p className="text-zinc-600">Dual CGST + SGST (18% Statutory Combined)</p>
              </div>
            </div>

            <div className="bg-zinc-50 p-4 border border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Taxable Supply Value</span>
                <span className="font-semibold">{formatCurrency(previewInvoice.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Central GST (CGST @ 9%)</span>
                <span>{formatCurrency(previewInvoice.cgst)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>State GST (SGST @ 9%)</span>
                <span>{formatCurrency(previewInvoice.sgst)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-300 flex justify-between font-bold text-sm text-black">
                <span>Total Statutory Amount</span>
                <span>{formatCurrency(previewInvoice.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-between items-center text-[10px] text-zinc-500">
              <span>This is an official digital tax document generated under Rule 48 of CGST Rules, 2017.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

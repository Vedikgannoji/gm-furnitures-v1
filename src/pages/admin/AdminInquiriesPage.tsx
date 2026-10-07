import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  X,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

export interface ContactInquiry {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'read' | 'resolved'
  createdAt: string
  updatedAt?: string
}

export const AdminInquiriesPage: React.FC = () => {
  const { token } = useAuth()
  const { showToast } = useToast()

  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'resolved'>('all')

  // Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const fetchInquiries = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/admin/inquiries', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to fetch contact inquiries.')
      }
      const data: ContactInquiry[] = await res.json()
      setInquiries(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to database.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = inq.name.toLowerCase().includes(q)
        const matchEmail = inq.email.toLowerCase().includes(q)
        const matchPhone = inq.phone.toLowerCase().includes(q)
        const matchSubject = inq.subject.toLowerCase().includes(q)
        return matchName || matchEmail || matchPhone || matchSubject
      }
      return true
    })
  }, [inquiries, statusFilter, searchQuery])

  // Count summaries
  const counts = useMemo(() => {
    return {
      all: inquiries.length,
      new: inquiries.filter((i) => i.status === 'new').length,
      read: inquiries.filter((i) => i.status === 'read').length,
      resolved: inquiries.filter((i) => i.status === 'resolved').length,
    }
  }, [inquiries])

  // Update Status handler
  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'read' | 'resolved') => {
    try {
      setIsUpdatingStatus(true)
      const res = await fetch(`/api/admin/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to update inquiry status.')
      }

      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus, updatedAt: new Date().toISOString() } : inq))
      )

      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null))
      }

      const statusLabels = { new: 'New', read: 'Read', resolved: 'Resolved' }
      showToast('Status Updated', `Inquiry marked as ${statusLabels[newStatus]}.`, 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status.'
      showToast('Update Failed', message, 'error')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: 'new' | 'read' | 'resolved') => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            New
          </span>
        )
      case 'read':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Read
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-muted font-semibold">Support & Concierge</span>
            <span className="text-muted text-xs">•</span>
            <span className="text-xs font-medium text-emerald-600">PostgreSQL Live</span>
          </div>
          <h1 className="text-2xl font-light tracking-wide text-foreground mt-1">Customer Inquiries</h1>
          <p className="text-xs text-muted mt-1">
            Review architectural consultation requests, bespoke inquiries, and customer messages submitted via the About and Contact forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInquiries}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 bg-background border transition-all cursor-pointer ${
            statusFilter === 'all' ? 'border-foreground ring-1 ring-foreground' : 'border-border hover:border-foreground/40'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium">Total Inquiries</div>
          <div className="text-2xl font-light text-foreground mt-1">{counts.all}</div>
        </div>

        <div
          onClick={() => setStatusFilter('new')}
          className={`p-4 bg-background border transition-all cursor-pointer ${
            statusFilter === 'new' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-border hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-amber-700 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            New / Unread
          </div>
          <div className="text-2xl font-light text-amber-700 mt-1">{counts.new}</div>
        </div>

        <div
          onClick={() => setStatusFilter('read')}
          className={`p-4 bg-background border transition-all cursor-pointer ${
            statusFilter === 'read' ? 'border-slate-500 ring-1 ring-slate-500' : 'border-border hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-700 font-medium">In Review / Read</div>
          <div className="text-2xl font-light text-slate-700 mt-1">{counts.read}</div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 bg-background border transition-all cursor-pointer ${
            statusFilter === 'resolved' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-border hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-medium">Resolved</div>
          <div className="text-2xl font-light text-emerald-700 mt-1">{counts.resolved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border focus:border-foreground focus:outline-none transition-colors"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-surface border border-border p-1">
          {(['all', 'new', 'read', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List / Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-background border border-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted mb-3" />
          <p className="text-xs text-muted">Retrieving customer inquiries from database...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-600" />
          <p className="text-xs font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInquiries} className="mt-4 text-xs">
            Retry Loading
          </Button>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="p-12 text-center bg-background border border-border">
          <MessageSquare className="w-8 h-8 mx-auto text-muted mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-medium text-foreground">No Inquiries Found</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No customer inquiries match your current search criteria.'
              : 'Customer submissions through the About or Contact forms will appear here in real-time.'}
          </p>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-4 text-xs">
              Clear Search Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-background border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className="hover:bg-surface/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-semibold uppercase text-muted">
                          {inq.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground group-hover:text-foreground/80">
                            {inq.name}
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-2">
                            <span>{inq.email}</span>
                            {inq.phone && (
                              <>
                                <span>•</span>
                                <span>{inq.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-foreground max-w-[180px] truncate">
                      {inq.subject || 'General Inquiry'}
                    </td>

                    <td className="py-3.5 px-4 text-muted max-w-[260px] truncate">
                      {inq.message}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(inq.status)}
                    </td>

                    <td className="py-3.5 px-4 text-muted text-[11px] whitespace-nowrap">
                      {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedInquiry(inq)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border bg-background hover:bg-surface text-foreground text-[11px] font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={Boolean(selectedInquiry)}
          onClose={() => setSelectedInquiry(null)}
          title={`Inquiry from ${selectedInquiry.name}`}
          maxWidth="lg"
        >
          <div className="space-y-6 pt-2">
            {/* Header info banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-surface border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold uppercase">
                  {selectedInquiry.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedInquiry.name}</h3>
                  <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedInquiry.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">Current Status</span>
                {getStatusBadge(selectedInquiry.status)}
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 border border-border bg-background">
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">Email Address</span>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="text-xs font-medium text-foreground hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-muted" />
                  {selectedInquiry.email}
                </a>
              </div>

              <div className="p-3.5 border border-border bg-background">
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">Phone Number</span>
                {selectedInquiry.phone ? (
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="text-xs font-medium text-foreground hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-muted" />
                    {selectedInquiry.phone}
                  </a>
                ) : (
                  <span className="text-xs text-muted">Not provided</span>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block mb-1">Subject</span>
              <div className="p-3 bg-surface border border-border text-xs font-semibold text-foreground">
                {selectedInquiry.subject || 'General Inquiry'}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block mb-1">Customer Message</span>
              <div className="p-4 bg-surface border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans min-h-[120px]">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Status changer buttons */}
            <div className="border-t border-border pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-foreground block">Update Status</span>
                  <span className="text-[11px] text-muted">Change inquiry lifecycle status in PostgreSQL database</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingStatus || selectedInquiry.status === 'new'}
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'new')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border transition-colors ${
                      selectedInquiry.status === 'new'
                        ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                        : 'border-border bg-background hover:bg-amber-50 text-amber-700'
                    }`}
                  >
                    Mark New
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || selectedInquiry.status === 'read'}
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'read')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border transition-colors ${
                      selectedInquiry.status === 'read'
                        ? 'bg-slate-700 text-white border-slate-700 font-semibold'
                        : 'border-border bg-background hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Mark Read
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || selectedInquiry.status === 'resolved'}
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'resolved')}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border transition-colors ${
                      selectedInquiry.status === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                        : 'border-border bg-background hover:bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

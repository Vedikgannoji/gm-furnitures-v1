import React, { useState } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Mail, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

export const ContactPage: React.FC = () => {
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'advisory',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    showToast('Inquiry Dispatched', 'Our atelier advisory team will contact you within 24 hours.', 'success')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <Breadcrumbs items={[{ label: 'Studio Contact' }]} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info (Left) */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <span className="editorial-badge text-muted">Client Concierge</span>
            <h1 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
              Connect with Atelier
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
              Whether arranging custom timber dimension adjustments, scheduling an architect consultation, or ordering material sample swatches, our design directors are here to assist.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-border text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider block">
                  Studio Headquarters & Flagship Gallery
                </span>
                <p className="text-muted mt-0.5">
                  Sector 44, Institutional Area, Gurugram, Haryana 122003, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider block">
                  Private Advisory Email
                </span>
                <p className="text-muted mt-0.5">concierge@gmfurniture.in</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider block">
                  Direct Line
                </span>
                <p className="text-muted mt-0.5">+91 (011) 4920-8000 (Mon–Sat, 10 AM – 7 PM IST)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form (Right) */}
        <div className="lg:col-span-7 bg-surface border border-border p-6 sm:p-10">
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-light text-foreground">Inquiry Received</h3>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                Thank you. An atelier spatial consultant has received your message and will respond shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitted(false)}
                className="mt-6"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
                Inquiry Form
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                    Inquiry Type
                  </label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="advisory">Residential Spatial Advisory</option>
                    <option value="custom">Custom Dimensions & Timber Commission</option>
                    <option value="trade">Architect & Interior Trade Program</option>
                    <option value="order">Existing Order Milestone Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your spatial project, room dimensions, or desired furniture finishes..."
                  className="w-full bg-background border border-border p-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full">
                Submit Consultation Request &rarr;
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

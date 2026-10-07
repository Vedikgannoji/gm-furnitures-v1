import React, { useState } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

export const ContactPage: React.FC = () => {
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'furniture',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast('Validation Error', 'Please complete all required fields.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          subject: formData.inquiryType,
          message: formData.message.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry.')

      setSubmitted(true)
      showToast('Inquiry Received', data.message || 'Thank you for contacting GM Furniture. We have received your message and will get back to you soon.', 'success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiryType: 'furniture',
        message: '',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message.'
      setErrorMessage(message)
      showToast('Error', message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} className="mb-3 sm:mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Contact Info (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="editorial-badge text-muted">Customer Support</span>
            <h1 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
              Connect with Us
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
              Have a question about our furniture, interiors, services, or upcoming collections? Get in touch with our team and we’ll be happy to assist.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-border text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider block">
                  Office & Experience Studio
                </span>
                <p className="text-muted mt-1 leading-relaxed">
                  GM Group of Interiors and Constructions,<br />
                  Raghavendra Nagar Colony, Road No-1,<br />
                  Near SR Digi School, Opposite SBI Bank,<br />
                  Suchitra, Flat No-51,<br />
                  Hyderabad, Telangana 500054, IN
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-border/50">
              <Mail className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider block">
                  EMAIL
                </span>
                <a
                  href="mailto:info@gminteriors.co"
                  className="text-muted hover:text-foreground mt-0.5 block hover:underline transition-colors"
                >
                  info@gminteriors.co
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-border/50">
              <Phone className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider block">
                  CONTACT NUMBERS
                </span>
                <div className="text-muted mt-0.5 flex flex-wrap items-center gap-1.5">
                  <a
                    href="tel:+917013672894"
                    className="hover:text-foreground hover:underline transition-colors"
                  >
                    +91 7013672894
                  </a>
                  <span>/</span>
                  <a
                    href="tel:+919381599950"
                    className="hover:text-foreground hover:underline transition-colors"
                  >
                    9381599950
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form (Right) */}
        <div className="lg:col-span-7 bg-surface border border-border p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-light text-foreground">Inquiry Received</h3>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                Thank you for reaching out. A member of our design team will contact you shortly.
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
                    Contact Number
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
                    <option value="furniture">Furniture Inquiry</option>
                    <option value="custom">Custom Sizing & Orders</option>
                    <option value="interior">Interior Design Consultation</option>
                    <option value="trade">Architect & Contractor Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your space, furniture requirements, or questions..."
                  className="w-full bg-background border border-border p-3 text-xs focus:border-foreground focus:outline-none resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto px-8"
              >
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

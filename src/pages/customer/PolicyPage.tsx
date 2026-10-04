import React from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const PolicyPage: React.FC = () => {
  const { policyType } = useParams<{ policyType: string }>()

  const policyContent: Record<
    string,
    { title: string; subtitle: string; sections: { heading: string; body: string }[] }
  > = {
    shipping: {
      title: 'White-Glove Delivery & Logistics Policy',
      subtitle: 'Precision handling and assembly of architectural furniture across India',
      sections: [
        {
          heading: '1. Complimentary White-Glove Qualification',
          body: 'All orders with a cumulative subtotal of ₹50,000 or greater qualify for complimentary White-Glove installation. For orders under ₹50,000, a subsidized flat shipping fee of ₹2,500 is applied.',
        },
        {
          heading: '2. Two-Person In-Room Delivery & Setup',
          body: 'Our delivery associates unbox, inspect, position, and assemble each furniture item in your room of choice. All wooden crates, corrugated packaging, and protective materials are removed upon completion.',
        },
        {
          heading: '3. Appointment Scheduling & Transit Confirmation',
          body: 'Our regional logistics coordinator will contact you 24 to 48 hours prior to delivery to confirm a 3-hour appointment window.',
        },
      ],
    },
    returns: {
      title: 'Returns, Replacements & Guarantee Policy',
      subtitle: 'Our commitment to enduring quality and client satisfaction',
      sections: [
        {
          heading: '1. 14-Day Considered Space Trial',
          body: 'We want you to experience each design in your residence. If a standard catalog piece does not harmonize with your spatial requirements, you may initiate a return within 14 days of delivery.',
        },
        {
          heading: '2. Return Condition & Packaging',
          body: 'Returned pieces must be in pristine, unaltered condition with no scratches, stains, or structural modifications.',
        },
        {
          heading: '3. Bespoke Custom Commissions',
          body: 'Made-to-order timber commissions with customized dimensions are non-returnable unless a verified manufacturing defect is identified upon installation.',
        },
      ],
    },
    privacy: {
      title: 'Client Privacy & Data Security Policy',
      subtitle: 'How GM Furniture Atelier protects and respects client information',
      sections: [
        {
          heading: '1. Information We Collect',
          body: 'We collect relevant client details (name, email, phone number, shipping address) strictly for order fulfillment, White-Glove delivery coordination, and statutory GST taxation invoicing.',
        },
        {
          heading: '2. Payment Gateway Security',
          body: 'All payment transactions are encrypted using 256-bit SSL protocols. Credit card details are processed through PCI-DSS Level 1 compliant infrastructure and never stored on our servers.',
        },
        {
          heading: '3. No Third-Party Data Sharing',
          body: 'We will never sell, rent, or trade your personal information to third-party advertisers or brokers.',
        },
      ],
    },
    terms: {
      title: 'Terms of Service & Atelier Agreement',
      subtitle: 'Statutory conditions governing orders, commissions, and digital commerce',
      sections: [
        {
          heading: '1. Atelier Commissions & Invoicing',
          body: 'All orders placed through the website constitute a formal purchase commission. Tax invoices are issued in accordance with Indian Goods and Services Tax (GST) statutes under HSN 94036000.',
        },
        {
          heading: '2. Natural Material Characteristics',
          body: 'Solid oak, walnut, teak, Roman travertine, and genuine leather inherently exhibit unique natural grain variations, mineral veining, and organic color subtleties.',
        },
        {
          heading: '3. Jurisdiction & Dispute Resolution',
          body: 'Any claims or disputes arising under these terms are subject to the exclusive jurisdiction of the courts of Gurugram, Haryana, India.',
        },
      ],
    },
  }

  const current = policyContent[policyType || 'shipping'] || policyContent['shipping']

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs
        items={[
          { label: 'Policies', href: '/policies/privacy' },
          { label: current.title },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="mb-8 sm:mb-10 pb-5 border-b border-border">
        <span className="editorial-badge text-muted">Legal & Client Assurance</span>
        <h1 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
          {current.title}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted">{current.subtitle}</p>
      </div>

      <div className="space-y-8 text-xs leading-relaxed text-muted">
        {current.sections.map((sec, i) => (
          <div key={i} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {sec.heading}
            </h2>
            <p className="text-xs text-muted leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

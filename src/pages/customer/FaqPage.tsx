import React from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Accordion } from '@/components/ui/Accordion'

export const FaqPage: React.FC = () => {
  const faqItems = [
    {
      id: 'faq-1',
      title: 'What does White-Glove delivery and installation include?',
      content:
        'Every GM Atelier order exceeding ₹50,000 qualifies for complimentary White-Glove logistics. A certified two-person freight team brings your furniture directly to your desired room, completes all assembly (including platform beds, dining table trestles, and modular sectionals), checks floor leveling, and removes all protective timber crating and packaging materials for recycling.',
    },
    {
      id: 'faq-2',
      title: 'What are the delivery lead times across India?',
      content:
        'In-stock pieces are typically dispatched within 48 to 72 hours from our primary atelier warehouse in Haryana, reaching major metro centers (NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata) within 3 to 6 business days. Custom upholstery pieces require a 2 to 3 week crafting window.',
    },
    {
      id: 'faq-3',
      title: 'What is covered under the 10-Year Framework Warranty?',
      content:
        'Our structural framework warranty covers defects in solid timber joinery, mortise-and-tenon joints, internal sinuous spring suspensions, and structural integrity under normal residential usage. It does not cover normal surface patina aging or accidental fabric spills.',
    },
    {
      id: 'faq-4',
      title: 'How do I care for solid oak, walnut, and natural travertine stone?',
      content:
        'For solid hardwoods, dust regularly with a clean, dry microfiber cloth. Reapply organic wood nourishing wax every 12 to 18 months. For natural Roman travertine and marble, wipe liquid spills immediately using pH-neutral stone cleaner. Always use coasters under cups and hot plates.',
    },
    {
      id: 'faq-5',
      title: 'Can I request bespoke custom dimensions for my residence?',
      content:
        'Yes. We can modify dining table lengths and configurations to suit your space. Contact info@gminteriors.co or call our team to discuss custom sizing.',
    },
    {
      id: 'faq-6',
      title: 'What is your returns policy?',
      content:
        'We offer a 14-day considered return window for standard catalog pieces in unused original condition. If a piece does not suit your space, our freight team will coordinate return retrieval. Return transit fees may apply unless returning due to shipping transit defect.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <Breadcrumbs items={[{ label: 'Client FAQ' }]} className="mb-8" />

      <div className="mb-12 pb-6 border-b border-border">
        <span className="editorial-badge text-muted">Frequently Asked Questions</span>
        <h1 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
          Client Care & Architectural Advisory
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
          Detailed information regarding specialized freight, solid timber joinery, white-glove setup, and warranty policies.
        </p>
      </div>

      <Accordion items={faqItems} allowMultiple defaultOpenIds={['faq-1', 'faq-2']} />
    </div>
  )
}

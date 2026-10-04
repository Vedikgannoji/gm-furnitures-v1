import React from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Accordion } from '@/components/ui/Accordion'

export const FaqPage: React.FC = () => {
  const faqItems = [
    {
      id: 'faq-1',
      title: 'What does home delivery and assembly include?',
      content:
        'Every GM Furniture order exceeding ₹50,000 qualifies for free delivery and assembly. Our team brings your furniture directly to your desired room, completes all assembly (including dining table bases and modular pieces), checks leveling, and clears away all protective packaging materials.',
    },
    {
      id: 'faq-2',
      title: 'What are the delivery lead times across India?',
      content:
        'In-stock pieces are typically dispatched within 48 to 72 hours from our primary warehouse, reaching major metro centers (NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata) within 3 to 6 business days. Custom pieces require a 2 to 3 week crafting window.',
    },
    {
      id: 'faq-3',
      title: 'What is covered under the 10-Year Framework Warranty?',
      content:
        'Our structural framework warranty covers defects in solid timber joinery, mortise-and-tenon joints, internal suspensions, and frame integrity under normal home usage. It does not cover normal surface patina aging or accidental spills.',
    },
    {
      id: 'faq-4',
      title: 'How do I care for solid oak, walnut, and natural stone?',
      content:
        'For solid hardwoods, dust regularly with a clean, dry microfiber cloth. Reapply organic wood nourishing wax every 12 to 18 months. For natural travertine and marble, wipe liquid spills immediately using pH-neutral stone cleaner. Always use coasters under cups and hot plates.',
    },
    {
      id: 'faq-5',
      title: 'Can I request custom dimensions for my home?',
      content:
        'Yes. We can modify dining table lengths and configurations to suit your space. Contact info@gminteriors.co or call our team to discuss custom sizing.',
    },
    {
      id: 'faq-6',
      title: 'What is your returns policy?',
      content:
        'We offer a 14-day return window for standard catalog pieces in unused original condition. If a piece does not suit your space, our logistics team will coordinate return retrieval. Return transit fees may apply unless returning due to shipping transit defect.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'FAQ' }]} className="mb-3 sm:mb-4" />

      <div className="mb-8 sm:mb-10 pb-5 border-b border-border">
        <span className="editorial-badge text-muted">Frequently Asked Questions</span>
        <h1 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
          Help & Frequently Asked Questions
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
          Helpful information regarding delivery, solid timber craftsmanship, home assembly, and warranty policies.
        </p>
      </div>

      <Accordion items={faqItems} allowMultiple defaultOpenIds={['faq-1', 'faq-2']} />
    </div>
  )
}

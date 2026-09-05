import type { Metadata } from 'next';
import { FaqAccordion } from '@/components/shop/faq-accordion';
import { buildFaqPageJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'FAQ | Gary’s Butchers & Fishmongers',
  description:
    'Delivery, click & collect, meat packs, payment and more: answers to common questions about ordering from Gary’s Butchers & Fishmongers.',
  alternates: { canonical: '/faq' },
};

const faqs = [
  {
    q: 'Do you deliver?',
    a: 'Yes, free home delivery within 5 miles of the shop. Between 5 and 10 miles, delivery is £3.95. Beyond 10 miles (up to 30 miles), a £5 delivery charge applies. Orders placed before 10am are delivered same day where possible.',
  },
  {
    q: 'Can I click & collect?',
    a: 'Absolutely. Place your order online, choose a pickup slot at checkout, and collect from our shop at 19 Park Glade Shops, Erskine. No charge for click & collect.',
  },
  {
    q: 'How fresh is the meat?',
    a: 'Everything in your order is hand-cut on the day of delivery or collection. Nothing is pre-packed or sat on a shelf for days.',
  },
  {
    q: 'Where does your meat come from?',
    a: 'Scottish-sourced wherever possible. We work with local farms and suppliers we know personally. The same goes for the fish on our fishmonger counter, which is fresh from the Scottish coast.',
  },
  {
    q: 'Can I order something specific that isn\'t on the website?',
    a: 'Yes, just give us a call or use the contact form with your request. We can prepare special cuts, larger joints for events, or custom mixes from our meat packs.',
  },
  {
    q: 'How do meat packs work?',
    a: 'Each pack contains a curated selection of cuts that gives great value over buying separately. The full contents are listed on each pack page. Your pack is bagged the day you collect or have it delivered.',
  },
  {
    q: 'How do I use a discount code?',
    a: 'Add your items to the basket, then enter the code at checkout in the “Discount code” field. We run regular promotions, so sign up to our newsletter or check our Facebook for the latest.',
  },
  {
    q: 'Do you do gift vouchers?',
    a: 'Yes, please pop into the shop or get in touch for gift vouchers. They make great presents for Christmas, birthdays and Father\'s Day.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major debit and credit cards via secure Stripe checkout (Visa, Mastercard, Amex, Apple Pay, Google Pay).',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Get in touch as soon as possible. We\'ll do everything we can to amend or cancel before your meat is cut. Once it\'s prepared, we may not be able to refund.',
  },
];

export default function FaqPage() {
  const faqJsonLd = buildFaqPageJsonLd(faqs);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Help</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Frequently asked
          </h1>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <FaqAccordion faqs={faqs} />
        </div>
      </section>
    </div>
  );
}

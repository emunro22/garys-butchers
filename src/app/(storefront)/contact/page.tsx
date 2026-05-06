import { ContactForm } from '@/components/shop/contact-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Gary’s Butchers & Fishmongers',
  description: 'Get in touch with Gary’s Butchers & Fishmongers in Erskine, Scotland.',
};

export default function ContactPage() {
  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Say hello</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Get in touch
          </h1>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8 grid lg:grid-cols-[1fr_1.3fr] gap-12 md:gap-16">
          {/* Info */}
          <div>
            <h2 className="font-display text-3xl text-ink-900 mb-6">Find us</h2>
            <div className="space-y-6 text-ink-700">
              <div>
                <p className="eyebrow text-ink-500 mb-2">Address</p>
                <p>
                  Bridgewater Shopping Centre<br />
                  Erskine PA8 7AA<br />
                  Scotland
                </p>
              </div>
              <div>
                <p className="eyebrow text-ink-500 mb-2">Phone</p>
                <p className="tabular text-lg">0141 555 1234</p>
              </div>
              <div>
                <p className="eyebrow text-ink-500 mb-2">Hours</p>
                <p>Monday — Friday · 8:00 — 17:00</p>
                <p>Saturday · 8:00 — 16:00</p>
                <p>Sunday · Closed</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-cream-100 border border-ink-900/10 p-6 md:p-10">
            <h2 className="font-display text-3xl text-ink-900 mb-2">Send a message</h2>
            <p className="text-ink-500 text-sm mb-6">
              Special orders, delivery enquiries, anything else — we&apos;ll come back to
              you within a working day.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}

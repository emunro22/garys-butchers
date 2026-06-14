import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Gary\'s Butchers & Fishmongers',
  description: 'Terms and conditions for shopping with Gary\'s Butchers & Fishmongers.',
};

export default function TermsPage() {
  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Legal</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Terms &amp; conditions
          </h1>
          <p className="mt-6 text-cream-200/70 text-sm">Last updated: June 2025</p>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="text-ink-700 leading-relaxed">
            These terms apply to all purchases made through garybutchers.co.uk and are governed by the laws
            of Scotland. By placing an order you agree to these terms.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">About us</h2>
          <p className="text-ink-700 leading-relaxed">
            Gary&apos;s Butchers &amp; Fishmongers is an independent, family-run business located at
            19 Park Glade Shops, Erskine.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Orders &amp; pricing</h2>
          <ul className="space-y-2 text-ink-700">
            <li>All prices are shown in GBP and include VAT where applicable.</li>
            <li>We reserve the right to correct pricing errors and will notify you before processing your order if a price needs to change.</li>
            <li>Your order is confirmed once you receive an email confirmation from us. This constitutes acceptance of your offer to purchase.</li>
            <li>We reserve the right to refuse or cancel an order at any time, in which case a full refund will be issued.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Payment</h2>
          <p className="text-ink-700 leading-relaxed">
            Payment is taken in full at the time of ordering via Stripe. We accept all major debit and credit
            cards, Apple Pay, and Google Pay. Your card details are encrypted and handled securely by Stripe —
            we never store them.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Delivery &amp; collection</h2>
          <ul className="space-y-2 text-ink-700">
            <li>Free delivery is available on orders over £25 within our local delivery area (Erskine and surrounding postcodes). A £3.50 charge applies below £25.</li>
            <li>Orders placed before 10am are delivered the same day where possible. Next-day delivery applies otherwise.</li>
            <li>Click &amp; Collect is free. You will receive a ready notification by email or phone when your order is prepared.</li>
            <li>We are not responsible for failed deliveries caused by incorrect address information provided at checkout.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Perishable goods &amp; freshness</h2>
          <p className="text-ink-700 leading-relaxed">
            All meat and fish is fresh and hand-cut to order. As a perishable food product, it must be
            refrigerated immediately on receipt and consumed within the use-by date indicated on the packaging.
            We cannot accept returns of perishable goods unless they are found to be faulty on delivery.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Cancellations &amp; refunds</h2>
          <ul className="space-y-2 text-ink-700">
            <li>You may cancel your order for a full refund any time before your meat is cut and prepared. Please contact us as soon as possible.</li>
            <li>Once an order has been prepared, we may not be able to offer a refund.</li>
            <li>If your order arrives damaged or incorrect, please contact us within 24 hours and we will arrange a replacement or refund.</li>
            <li>Refunds are processed via the original payment method within 5–10 business days.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Discount codes &amp; promotions</h2>
          <ul className="space-y-2 text-ink-700">
            <li>Discount codes are single-use and cannot be applied retrospectively.</li>
            <li>Only one promotion may be applied per order unless stated otherwise.</li>
            <li>We reserve the right to withdraw promotions at any time.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Allergens</h2>
          <p className="text-ink-700 leading-relaxed">
            Our products are prepared in an environment that handles a wide variety of meats, marinades, and
            seasonings. If you have an allergy or dietary requirement, please contact us before ordering so
            we can advise accordingly. We cannot guarantee a completely allergen-free environment.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Limitation of liability</h2>
          <p className="text-ink-700 leading-relaxed">
            Our liability is limited to the value of your order. We are not liable for indirect or
            consequential losses. Nothing in these terms affects your statutory rights under UK consumer law.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Governing law</h2>
          <p className="text-ink-700 leading-relaxed">
            These terms are governed by the laws of Scotland. Any disputes will be subject to the exclusive
            jurisdiction of the Scottish courts.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Contact</h2>
          <p className="text-ink-700 leading-relaxed">
            For any questions about these terms, please{' '}
            <a href="/contact" className="text-gold-700 underline underline-offset-2">contact us</a>.
          </p>
        </div>
      </section>
    </div>
  );
}

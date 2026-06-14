import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Gary\'s Butchers & Fishmongers',
  description: 'How Gary\'s Butchers & Fishmongers collects and uses your personal information.',
};

export default function PrivacyPage() {
  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Legal</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Privacy policy
          </h1>
          <p className="mt-6 text-cream-200/70 text-sm">Last updated: June 2025</p>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8 prose prose-ink">
          <p className="text-ink-700 leading-relaxed">
            Gary&apos;s Butchers &amp; Fishmongers (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your
            personal information. This policy explains what data we collect, how we use it, and your rights
            under UK GDPR.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Who we are</h2>
          <p className="text-ink-700 leading-relaxed">
            Gary&apos;s Butchers &amp; Fishmongers<br />
            19 Park Glade Shops, Erskine<br />
            Contact: <a href="/contact" className="text-gold-700 underline underline-offset-2">via our contact form</a>
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Information we collect</h2>
          <ul className="space-y-2 text-ink-700">
            <li><strong>Order information</strong> — your name, delivery address, email address, and phone number when you place an order.</li>
            <li><strong>Payment information</strong> — card details are processed securely by Stripe. We never store your full card number.</li>
            <li><strong>Contact messages</strong> — anything you submit through our contact form.</li>
            <li><strong>Newsletter subscription</strong> — your email address if you opt in to marketing emails.</li>
            <li><strong>Website usage</strong> — basic analytics such as pages visited and referring sources, collected without personally identifying you.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">How we use your information</h2>
          <ul className="space-y-2 text-ink-700">
            <li>To process and fulfil your order, including sending order confirmations and delivery updates.</li>
            <li>To respond to enquiries you send us.</li>
            <li>To send you promotional emails, only if you have opted in. You can unsubscribe at any time.</li>
            <li>To improve our website and service.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Legal basis for processing</h2>
          <p className="text-ink-700 leading-relaxed">
            We process your data on the basis of <strong>contract</strong> (to fulfil your order), <strong>legitimate interest</strong>
            (to run and improve our business), and <strong>consent</strong> (for marketing emails).
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Third parties</h2>
          <ul className="space-y-2 text-ink-700">
            <li><strong>Stripe</strong> — payment processing. Stripe may store payment data in line with their own privacy policy.</li>
            <li>We do not sell your personal data to any third party.</li>
          </ul>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">How long we keep your data</h2>
          <p className="text-ink-700 leading-relaxed">
            Order records are retained for 7 years for accounting purposes. Marketing preferences are kept
            until you unsubscribe. Contact form messages are kept for as long as necessary to resolve your
            enquiry.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Your rights</h2>
          <p className="text-ink-700 leading-relaxed">
            Under UK GDPR you have the right to access, correct, or delete your personal data, and to object
            to or restrict how we process it. To exercise any of these rights, please{' '}
            <a href="/contact" className="text-gold-700 underline underline-offset-2">get in touch</a>.
          </p>
          <p className="text-ink-700 leading-relaxed mt-4">
            You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO)
            at <strong>ico.org.uk</strong>.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Cookies</h2>
          <p className="text-ink-700 leading-relaxed">
            We use only strictly necessary cookies to keep your shopping cart active during your visit. We do
            not use advertising or tracking cookies.
          </p>

          <h2 className="font-display text-2xl text-ink-900 mt-10 mb-4">Changes to this policy</h2>
          <p className="text-ink-700 leading-relaxed">
            We may update this policy from time to time. The date at the top of the page will always show
            when it was last revised.
          </p>
        </div>
      </section>
    </div>
  );
}

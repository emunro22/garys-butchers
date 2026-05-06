import { Checkout } from '@/components/shop/checkout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — Gary’s Butchers & Fishmongers',
  description: 'Complete your order at Gary’s Butchers & Fishmongers.',
};

export default function CheckoutPage() {
  return (
    <div className="bg-cream-50">
      <section className="border-b border-ink-900/10 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-ink-500 mb-3">Checkout</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900">
            Almost there.
          </h1>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Checkout />
        </div>
      </section>
    </div>
  );
}

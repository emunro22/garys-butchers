'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import { useCart, cartSubtotal } from '@/lib/cart';
import { formatPrice, FREE_DELIVERY_THRESHOLD_PENCE } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD_PENCE - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD_PENCE) * 100);

  if (items.length === 0) {
    return (
      <div className="bg-cream-50 min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="eyebrow text-ink-500 mb-3">Your basket</p>
          <h1 className="font-display text-4xl text-ink-900">Empty as a butcher&apos;s slab.</h1>
          <p className="text-ink-700 mt-3">
            Browse the shop or pick up one of our family meat packs.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/shop">
              <Button variant="primary">Shop all</Button>
            </Link>
            <Link href="/meat-packs">
              <Button variant="outline">Meat packs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream-50">
      <section className="border-b border-ink-900/10 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-ink-500 mb-3">Your basket</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900">Review your order</h1>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid lg:grid-cols-[1fr_400px] gap-10">
          {/* Items */}
          <div>
            <ul className="divide-y divide-ink-900/10 border-y border-ink-900/10">
              {items.map((item) => (
                <li key={item.productId} className="py-6 flex gap-4 md:gap-6">
                  <div className="relative h-24 w-24 md:h-32 md:w-32 bg-ink-900/5 shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-ink-400">
                        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-display text-lg md:text-xl text-ink-900 hover:text-gold-700 transition-colors block truncate"
                        >
                          {item.name}
                        </Link>
                        {item.weightLabel && (
                          <p className="text-xs text-ink-500 mt-0.5">{item.weightLabel}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-ink-400 hover:text-butcher-500 transition-colors p-1"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center border border-ink-900/15">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="h-9 w-9 flex items-center justify-center hover:bg-ink-900/5"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center text-sm tabular">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="h-9 w-9 flex items-center justify-center hover:bg-ink-900/5"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-medium text-ink-900 tabular">
                        {formatPrice(item.priceInPence * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <aside className="bg-cream-100 border border-ink-900/10 p-6 md:p-8 h-fit lg:sticky lg:top-28">
            <h2 className="font-display text-2xl text-ink-900">Summary</h2>

            {/* Free delivery progress */}
            <div className="mt-6">
              {remaining > 0 ? (
                <p className="text-sm text-ink-700">
                  You&apos;re{' '}
                  <span className="font-semibold text-ink-900">
                    {formatPrice(remaining)}
                  </span>{' '}
                  away from <span className="font-semibold">free home delivery</span>.
                </p>
              ) : (
                <p className="text-sm text-gold-700 font-medium">
                  ✓ You&apos;ve qualified for free home delivery.
                </p>
              )}
              <div className="mt-3 h-1.5 bg-ink-900/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <dl className="mt-6 space-y-2 text-sm border-t border-ink-900/10 pt-6">
              <div className="flex justify-between">
                <dt className="text-ink-700">Subtotal</dt>
                <dd className="tabular text-ink-900">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-700">Delivery</dt>
                <dd className="text-ink-500">Calculated at checkout</dd>
              </div>
            </dl>

            <Link href="/checkout" className="block mt-8">
              <Button variant="primary" size="lg" className="w-full">
                Proceed to checkout
              </Button>
            </Link>
            <Link
              href="/shop"
              className="mt-3 block text-center text-xs uppercase tracking-[0.22em] text-ink-700 hover:text-ink-900 underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

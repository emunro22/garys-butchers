'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, Truck } from 'lucide-react';
import { useCart, cartSubtotal } from '@/lib/cart';
import { formatPrice, FREE_DELIVERY_THRESHOLD_PENCE } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function CartDrawer() {
  const { items, isOpen, close, updateQuantity, removeItem } = useCart();
  const subtotal = cartSubtotal(items);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_PENCE - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD_PENCE) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-ink-900/60 z-50"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 w-[420px] max-w-full bg-cream-50 z-50 flex flex-col"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-ink-900/10">
              <h2 className="font-display text-2xl">Your basket</h2>
              <button onClick={close} className="p-2 -mr-2 text-ink-700 hover:text-ink-900">
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Free delivery progress */}
            {items.length > 0 && (
              <div className="px-6 py-4 border-b border-ink-900/10 bg-cream-100">
                <div className="flex items-center gap-2 text-xs mb-2">
                  <Truck className="h-3.5 w-3.5 text-gold-500" />
                  {remainingForFreeDelivery > 0 ? (
                    <span>
                      Add{' '}
                      <strong className="text-ink-900">
                        {formatPrice(remainingForFreeDelivery)}
                      </strong>{' '}
                      for free home delivery
                    </span>
                  ) : (
                    <span className="text-ink-900 font-medium">
                      You&apos;ve unlocked free home delivery 🎉
                    </span>
                  )}
                </div>
                <div className="h-1 bg-ink-900/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeDeliveryProgress}%` }}
                    className="h-full bg-gold-400"
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <p className="font-display text-2xl mb-2">Your basket is empty.</p>
                  <p className="text-sm text-ink-500 mb-8 max-w-xs">
                    Pick a few cuts from the counter and we&apos;ll get them ready for you.
                  </p>
                  <Button onClick={close} variant="primary" size="md">
                    Start shopping
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-ink-900/10">
                  {items.map((item) => (
                    <li key={item.productId} className="py-4 flex gap-4">
                      <div className="h-20 w-20 bg-ink-900/5 shrink-0 relative overflow-hidden">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={close}
                            className="font-display text-base leading-tight hover:underline"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-ink-400 hover:text-butcher-500 text-xs eyebrow"
                          >
                            Remove
                          </button>
                        </div>
                        {item.weightLabel && (
                          <p className="text-xs text-ink-500 mt-0.5">{item.weightLabel}</p>
                        )}
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <div className="flex items-center border border-ink-900/20">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="h-8 w-8 flex items-center justify-center hover:bg-ink-900/5"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-8 min-w-[32px] flex items-center justify-center text-sm tabular">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="h-8 w-8 flex items-center justify-center hover:bg-ink-900/5"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="tabular text-sm font-medium">
                            {formatPrice(item.priceInPence * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <footer className="border-t border-ink-900/10 px-6 py-5 bg-cream-50">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="eyebrow">Subtotal</span>
                  <span className="font-display text-2xl tabular">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-ink-500 mb-4">
                  Delivery and any discount codes are added at checkout.
                </p>
                <Link href="/checkout" onClick={close} className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Checkout
                  </Button>
                </Link>
                <button
                  onClick={close}
                  className="block w-full text-center text-xs eyebrow mt-3 text-ink-500 hover:text-ink-900"
                >
                  Continue shopping
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

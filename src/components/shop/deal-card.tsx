'use client';

import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

export type EnrichedDealItem = {
  productId: string;
  quantity: number;
  name: string;
  priceInPence: number;
  imageUrl: string | null;
  weightLabel: string | null;
  slug: string;
};

type Props = {
  id: string;
  title: string;
  description: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  category: string;
  endsAt: Date | null;
  items: EnrichedDealItem[];
  dealPrice: number | null;
};

export function DealCard({ title, description, badgeText, imageUrl, category, endsAt, items, dealPrice }: Props) {
  const { addItem, open } = useCart();
  const [added, setAdded] = useState(false);

  const calculatedTotal = items.reduce((s, i) => s + i.priceInPence * i.quantity, 0);
  const displayPrice = dealPrice ?? calculatedTotal;
  const hasSaving = dealPrice !== null && dealPrice < calculatedTotal;

  function handleAddAll() {
    for (const item of items) {
      addItem(
        {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          priceInPence: item.priceInPence,
          imageUrl: item.imageUrl ?? undefined,
          weightLabel: item.weightLabel ?? undefined,
        },
        item.quantity,
      );
    }
    setAdded(true);
    open();
    setTimeout(() => setAdded(false), 3000);
  }

  const categoryLabel =
    category === 'christmas' ? 'Christmas Special'
    : category === 'easter' ? 'Easter Special'
    : category === 'summer-bbq' ? 'Summer BBQ'
    : 'Special Offer';

  return (
    <article className="relative overflow-hidden border border-gold-400/20 group flex flex-col">
      {/* Background image */}
      {imageUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-20 group-hover:opacity-25 transition-opacity duration-500 scale-105 group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/75 to-ink-900/95" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-ink-900" />
      )}

      <div className="relative z-10 p-8 md:p-10 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-6">
          {badgeText && (
            <span className="inline-block mb-3 text-[10px] tracking-[0.18em] uppercase bg-gold-400 text-ink-900 px-2 py-0.5 font-semibold">
              {badgeText}
            </span>
          )}
          <p className="eyebrow text-gold-400/70 mb-1">{categoryLabel}</p>
          <h3 className="font-display text-3xl md:text-4xl leading-tight text-cream-50">{title}</h3>
          {description && (
            <p className="mt-3 text-cream-200/75 text-sm leading-relaxed">{description}</p>
          )}
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="border-t border-gold-400/20 pt-5 mb-5 flex-1">
            <p className="eyebrow text-gold-400/70 mb-3">What&apos;s in this deal</p>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-cream-100 flex items-center gap-2">
                    <span className="text-gold-400 text-xs">·</span>
                    {item.quantity > 1 && (
                      <span className="text-gold-400 font-semibold tabular">{item.quantity}×</span>
                    )}
                    <span>{item.name}</span>
                    {item.weightLabel && (
                      <span className="text-cream-200/50 text-xs hidden sm:inline">
                        {item.weightLabel}
                      </span>
                    )}
                  </span>
                  <span className="text-cream-200/60 tabular shrink-0 text-xs">
                    {formatPrice(item.priceInPence * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Price row */}
            <div className="mt-4 pt-3 border-t border-gold-400/20 flex items-center justify-between">
              <div>
                {hasSaving && (
                  <p className="text-xs text-cream-200/50 line-through tabular">
                    {formatPrice(calculatedTotal)}
                  </p>
                )}
                <p className="font-display text-3xl text-gold-400 tabular leading-none">
                  {formatPrice(displayPrice)}
                </p>
                {hasSaving && (
                  <p className="text-xs text-green-400 mt-0.5">
                    Save {formatPrice(calculatedTotal - displayPrice)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddAll}
                className={`inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em] font-semibold transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-gold-400 text-ink-900 hover:bg-gold-300'
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Add to cart
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* End date */}
        {endsAt && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold-400/70 flex items-center gap-2 mt-auto">
            <span className="inline-block w-4 h-px bg-gold-400/40" />
            Ends{' '}
            {new Date(endsAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </article>
  );
}

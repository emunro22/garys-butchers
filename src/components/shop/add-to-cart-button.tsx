'use client';

import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import type { Product } from '@/lib/db/schema';
import { formatPrice, percentOff } from '@/lib/utils';

type Variant = {
  label: string;
  priceInPence: number;
  compareAtPriceInPence?: number;
};

export function AddToCartButton({
  product,
  variant = 'light',
}: {
  product: Product;
  variant?: 'light' | 'dark';
}) {
  const variants: Variant[] = (product.variants as Variant[] | undefined) ?? [];
  const hasVariants = variants.length > 0;
  const marinades: string[] = (product.marinades as string[] | undefined) ?? [];
  const hasMarinades = marinades.length > 0;

  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    hasVariants ? variants[0] : null
  );
  const [selectedMarinade, setSelectedMarinade] = useState<string | null>(
    hasMarinades ? marinades[0] : null
  );
  const addItem = useCart((s) => s.addItem);

  const activePrice = selectedVariant?.priceInPence ?? product.priceInPence;
  const variantOnSale =
    !!selectedVariant?.compareAtPriceInPence &&
    selectedVariant.compareAtPriceInPence > selectedVariant.priceInPence;

  const onAdd = () => {
    if (hasVariants && !selectedVariant) return;
    if (hasMarinades && !selectedMarinade) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceInPence: activePrice,
        imageUrl: product.imageUrl ?? undefined,
        weightLabel: product.weightLabel ?? undefined,
        variantLabel: selectedVariant?.label,
        marinadeLabel: selectedMarinade ?? undefined,
        noticeDays: product.noticeDays,
        isPack: product.isPack,
      },
      quantity
    );
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1800);
  };

  const stepperBorder =
    variant === 'dark' ? 'border-gold-400/40 text-cream-50' : 'border-ink-900/20';
  const stepperHover = variant === 'dark' ? 'hover:bg-cream-50/5' : 'hover:bg-ink-900/5';
  const selectBg = variant === 'dark' ? 'bg-ink-800 border-gold-400/40 text-cream-50' : 'bg-cream-50 border-ink-900/15 text-ink-900';

  return (
    <div className="flex flex-col gap-5">
      {/* Variant dropdown */}
      {hasVariants && (
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${variant === 'dark' ? 'text-gold-400/70' : 'text-ink-500'}`}>
            Choose size
          </p>
          <select
            value={selectedVariant?.label ?? ''}
            onChange={(e) => {
              const v = variants.find((v) => v.label === e.target.value);
              setSelectedVariant(v ?? null);
            }}
            className={`w-full border px-3 h-11 text-sm ${selectBg}`}
          >
            {variants.map((v) => {
              const saleActive =
                !!v.compareAtPriceInPence && v.compareAtPriceInPence > v.priceInPence;
              return (
                <option key={v.label} value={v.label}>
                  {v.label}: {formatPrice(v.priceInPence)}
                  {saleActive ? ` (was ${formatPrice(v.compareAtPriceInPence!)})` : ''}
                </option>
              );
            })}
          </select>

          {/* Price updates as you pick a size */}
          {selectedVariant && (
            <div className="mt-3 flex items-baseline gap-3">
              <p className={`font-display text-3xl tabular ${variant === 'dark' ? 'text-cream-50' : 'text-ink-900'}`}>
                {formatPrice(selectedVariant.priceInPence)}
              </p>
              {variantOnSale && (
                <>
                  <p className={`text-base line-through tabular ${variant === 'dark' ? 'text-gold-400/50' : 'text-ink-400'}`}>
                    {formatPrice(selectedVariant.compareAtPriceInPence!)}
                  </p>
                  <span className="text-xs uppercase tracking-[0.15em] font-semibold text-butcher-500 bg-butcher-500/10 px-2 py-1">
                    Save {percentOff(selectedVariant.priceInPence, selectedVariant.compareAtPriceInPence!)}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Marinade dropdown */}
      {hasMarinades && (
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${variant === 'dark' ? 'text-gold-400/70' : 'text-ink-500'}`}>
            Choose marinade
          </p>
          <select
            value={selectedMarinade ?? ''}
            onChange={(e) => setSelectedMarinade(e.target.value || null)}
            className={`w-full border px-3 h-11 text-sm ${selectBg}`}
          >
            {marinades.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity + add to basket */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex items-center border h-14 w-fit ${stepperBorder}`}>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className={`h-full w-12 flex items-center justify-center ${stepperHover}`}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="h-full px-4 flex items-center justify-center min-w-[60px] tabular text-base font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className={`h-full w-12 flex items-center justify-center ${stepperHover}`}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          onClick={onAdd}
          variant={variant === 'dark' ? 'gold' : 'primary'}
          size="lg"
          className="flex-1 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {showAdded ? (
              <motion.span
                key="added"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Added to basket
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
              >
                Add to basket
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}

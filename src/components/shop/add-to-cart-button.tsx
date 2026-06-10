'use client';

import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import type { Product } from '@/lib/db/schema';
import { formatPrice } from '@/lib/utils';

type Variant = { label: string; priceInPence: number };

export function AddToCartButton({
  product,
  variant = 'light',
}: {
  product: Product;
  variant?: 'light' | 'dark';
}) {
  const variants: Variant[] = (product.variants as Variant[] | undefined) ?? [];
  const hasVariants = variants.length > 0;

  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    hasVariants ? variants[0] : null
  );
  const addItem = useCart((s) => s.addItem);

  const activePrice = selectedVariant?.priceInPence ?? product.priceInPence;

  const onAdd = () => {
    if (hasVariants && !selectedVariant) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceInPence: activePrice,
        imageUrl: product.imageUrl ?? undefined,
        weightLabel: product.weightLabel ?? undefined,
        variantLabel: selectedVariant?.label,
      },
      quantity
    );
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1800);
  };

  const stepperBorder =
    variant === 'dark' ? 'border-gold-400/40 text-cream-50' : 'border-ink-900/20';
  const stepperHover = variant === 'dark' ? 'hover:bg-cream-50/5' : 'hover:bg-ink-900/5';

  return (
    <div className="flex flex-col gap-4">
      {hasVariants && (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = selectedVariant?.label === v.label;
              return (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 py-2 border text-sm transition-colors ${
                    active
                      ? 'border-ink-900 bg-ink-900 text-cream-50'
                      : variant === 'dark'
                      ? 'border-gold-400/40 text-cream-50 hover:border-gold-400'
                      : 'border-ink-900/20 text-ink-900 hover:border-ink-900'
                  }`}
                >
                  <span className="font-medium">{v.label}</span>
                  <span className={`ml-2 text-xs ${active ? 'text-cream-200' : 'text-ink-500'}`}>
                    {formatPrice(v.priceInPence)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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

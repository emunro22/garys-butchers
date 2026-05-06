'use client';

import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import type { Product } from '@/lib/db/schema';

export function AddToCartButton({
  product,
  variant = 'light',
}: {
  product: Product;
  variant?: 'light' | 'dark';
}) {
  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const onAdd = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceInPence: product.priceInPence,
        imageUrl: product.imageUrl ?? undefined,
        weightLabel: product.weightLabel ?? undefined,
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
  );
}

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceInPence: number;
  imageUrl?: string;
  quantity: number;
  weightLabel?: string;
  variantLabel?: string;
};

// Unique key per cart line (product + optional variant)
export function cartKey(productId: string, variantLabel?: string) {
  return variantLabel ? `${productId}::${variantLabel}` : productId;
}

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantLabel?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantLabel?: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const key = cartKey(item.productId, item.variantLabel);
          const existing = state.items.find(
            (i) => cartKey(i.productId, i.variantLabel) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i.productId, i.variantLabel) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
            isOpen: true,
          };
        }),
      removeItem: (productId, variantLabel) =>
        set((state) => {
          const key = cartKey(productId, variantLabel);
          return { items: state.items.filter((i) => cartKey(i.productId, i.variantLabel) !== key) };
        }),
      updateQuantity: (productId, quantity, variantLabel) =>
        set((state) => {
          const key = cartKey(productId, variantLabel);
          return {
            items:
              quantity <= 0
                ? state.items.filter((i) => cartKey(i.productId, i.variantLabel) !== key)
                : state.items.map((i) =>
                    cartKey(i.productId, i.variantLabel) === key ? { ...i, quantity } : i
                  ),
          };
        }),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'garys-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.priceInPence * item.quantity, 0);

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

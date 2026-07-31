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
  marinadeLabel?: string;
  noticeDays?: number;
  isPack?: boolean;
};

// Unique key per cart line (product + optional variant + optional marinade)
export function cartKey(productId: string, variantLabel?: string, marinadeLabel?: string) {
  return [productId, variantLabel, marinadeLabel].filter(Boolean).join('::');
}

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantLabel?: string, marinadeLabel?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantLabel?: string, marinadeLabel?: string) => void;
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
          const key = cartKey(item.productId, item.variantLabel, item.marinadeLabel);
          const existing = state.items.find(
            (i) => cartKey(i.productId, i.variantLabel, i.marinadeLabel) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i.productId, i.variantLabel, i.marinadeLabel) === key
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
      removeItem: (productId, variantLabel, marinadeLabel) =>
        set((state) => {
          const key = cartKey(productId, variantLabel, marinadeLabel);
          return { items: state.items.filter((i) => cartKey(i.productId, i.variantLabel, i.marinadeLabel) !== key) };
        }),
      updateQuantity: (productId, quantity, variantLabel, marinadeLabel) =>
        set((state) => {
          const key = cartKey(productId, variantLabel, marinadeLabel);
          return {
            items:
              quantity <= 0
                ? state.items.filter((i) => cartKey(i.productId, i.variantLabel, i.marinadeLabel) !== key)
                : state.items.map((i) =>
                    cartKey(i.productId, i.variantLabel, i.marinadeLabel) === key ? { ...i, quantity } : i
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

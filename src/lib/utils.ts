import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const FREE_DELIVERY_THRESHOLD_PENCE = 2500;
export const STANDARD_DELIVERY_FEE_PENCE = 350;

export function calculateDelivery(subtotalInPence: number, fulfilment: 'pickup' | 'delivery') {
  if (fulfilment === 'pickup') return 0;
  if (subtotalInPence >= FREE_DELIVERY_THRESHOLD_PENCE) return 0;
  return STANDARD_DELIVERY_FEE_PENCE;
}

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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function geocodePostcode(postcode: string): Promise<{ lat: number; lon: number } | null> {
  const clean = postcode.replace(/\s+/g, '').toUpperCase();
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { lat: data.result.latitude, lon: data.result.longitude };
  } catch {
    return null;
  }
}

// Shop postcode – update if you ever move
const SHOP_POSTCODE = 'PA87HH';
let shopCoordsCache: { lat: number; lon: number } | null = null;

async function getShopCoords(): Promise<{ lat: number; lon: number } | null> {
  if (shopCoordsCache) return shopCoordsCache;
  const coords = await geocodePostcode(SHOP_POSTCODE);
  if (coords) shopCoordsCache = coords;
  return coords;
}

export async function getDistanceMiles(customerPostcode: string): Promise<number | null> {
  const [shopCoords, customerCoords] = await Promise.all([
    getShopCoords(),
    geocodePostcode(customerPostcode),
  ]);
  if (!shopCoords || !customerCoords) return null;
  const km = haversineKm(shopCoords.lat, shopCoords.lon, customerCoords.lat, customerCoords.lon);
  return km * 0.621371;
}

export function calculateDeliveryByDistance(
  subtotalInPence: number,
  distanceMiles: number | null,
  settings: { freeThresholdPence: number; feePence: number; radiusMiles: number; premiumFeePence: number }
): number {
  // Unknown distance → fall back to standard fee logic
  if (distanceMiles === null) {
    return subtotalInPence >= settings.freeThresholdPence ? 0 : settings.feePence;
  }
  if (distanceMiles <= settings.radiusMiles) {
    return subtotalInPence >= settings.freeThresholdPence ? 0 : settings.feePence;
  }
  // Beyond radius – premium fee always applies
  return settings.premiumFeePence;
}

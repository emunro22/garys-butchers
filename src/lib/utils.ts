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

// Rounds down so a "20% off" badge never overstates the actual saving.
export function percentOff(priceInPence: number, compareAtPriceInPence: number): number {
  if (compareAtPriceInPence <= priceInPence) return 0;
  return Math.floor((1 - priceInPence / compareAtPriceInPence) * 100);
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

const AVATAR_COLORS = ['#1a73e8', '#d93025', '#188038', '#e37400', '#9334e6', '#12847e'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const STANDARD_DELIVERY_FEE_PENCE = 395;
export const MINIMUM_DELIVERY_ORDER_PENCE = 2500;

// Rough pre-postcode estimate shown before the customer enters an address —
// the real, distance-based fee (see calculateDeliveryByDistance) replaces this
// once the postcode is known.
export function calculateDelivery(fulfilment: 'pickup' | 'delivery') {
  if (fulfilment === 'pickup') return 0;
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

// Actual road distance, not straight-line — Erskine sits right at the
// Erskine Bridge/River Clyde, so a postcode across the water can be within
// a few hundred metres "as the crow flies" while genuinely being several
// miles further by road. Uses OSRM's public demo routing server (free, no
// API key) — not officially guaranteed for production traffic, but fine at
// this shop's order volume.
async function getDrivingDistanceMiles(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meters = data?.routes?.[0]?.distance;
    return typeof meters === 'number' ? meters / 1609.344 : null;
  } catch {
    return null;
  }
}

export async function getDistanceMiles(customerPostcode: string): Promise<number | null> {
  const [shopCoords, customerCoords] = await Promise.all([
    getShopCoords(),
    geocodePostcode(customerPostcode),
  ]);
  if (!shopCoords || !customerCoords) return null;
  const drivingMiles = await getDrivingDistanceMiles(shopCoords, customerCoords);
  if (drivingMiles !== null) return drivingMiles;
  // Routing server unreachable — fall back to straight-line distance rather
  // than blocking every delivery order on a third-party outage.
  const km = haversineKm(shopCoords.lat, shopCoords.lon, customerCoords.lat, customerCoords.lon);
  return km * 0.621371;
}

export function calculateDeliveryByDistance(
  distanceMiles: number | null,
  settings: {
    freeUnderMiles: number;
    midTierMiles: number;
    midTierFeePence: number;
    farFeePence: number;
    radiusMiles: number;
  }
): { feePence: number; withinRadius: boolean } {
  // Unknown distance (geocoding failed, e.g. bad postcode) → can't verify it's in range, so don't allow it.
  if (distanceMiles === null || distanceMiles > settings.radiusMiles) {
    return { feePence: 0, withinRadius: false };
  }
  let feePence: number;
  if (distanceMiles < settings.freeUnderMiles) {
    feePence = 0;
  } else if (distanceMiles < settings.midTierMiles) {
    feePence = settings.midTierFeePence;
  } else {
    feePence = settings.farFeePence;
  }
  return { feePence, withinRadius: true };
}

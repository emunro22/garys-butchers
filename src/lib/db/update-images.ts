/**
 * Assigns product-specific stock Unsplash images to products that have no imageUrl.
 * Safe to re-run — only touches rows where imageUrl IS NULL.
 *
 * Run with:  npm run db:images
 *
 * To replace a specific product's image, clear imageUrl in Admin → Products → edit, then re-run,
 * or just upload a real photo directly in the admin product form.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './index';
import { products, categories } from './schema';
import { eq, isNull } from 'drizzle-orm';

// Matched against product name (case-insensitive) in order — first match wins.
// All photos from Unsplash (https://unsplash.com) — free to use under the Unsplash licence.
const PRODUCT_IMAGES: Array<[RegExp, string]> = [
  // ── Beef ──────────────────────────────────────────────────────────────────
  [/sirloin/i,           'https://images.unsplash.com/photo-1546964124-0cce460e0700?w=800&q=80'],
  [/popeseye/i,          'https://images.unsplash.com/photo-1607116667981-ff0f5b0c8c29?w=800&q=80'],
  [/rump steak/i,        'https://images.unsplash.com/photo-1607116667981-ff0f5b0c8c29?w=800&q=80'],
  [/roasting joint/i,    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'],
  [/diced beef/i,        'https://images.unsplash.com/photo-1529359536977-1ce2c7543cca?w=800&q=80'],
  [/steak mince|mince/i, 'https://images.unsplash.com/photo-1588347785-3f1e5b15c1a4?w=800&q=80'],
  [/beef olive/i,        'https://images.unsplash.com/photo-1546964124-0cce460e0700?w=800&q=80'],

  // ── Pork ──────────────────────────────────────────────────────────────────
  [/pork loin steak/i,   'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80'],
  [/pork.*link/i,        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
  [/pork olive/i,        'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80'],

  // ── Chicken ───────────────────────────────────────────────────────────────
  [/chicken fillet/i,    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80'],
  [/chicken burger/i,    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],

  // ── Fish ──────────────────────────────────────────────────────────────────
  [/salmon/i,            'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'],
  [/haddock/i,           'https://images.unsplash.com/photo-1535637603896-07c179d71103?w=800&q=80'],
  [/prawn/i,             'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80'],
  [/cod/i,               'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80'],

  // ── Sausages & Burgers ────────────────────────────────────────────────────
  [/steak burger|rump.*burger/i, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
  [/beef sausage|beef.*link/i,   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],

  // ── Pies & Bakery ─────────────────────────────────────────────────────────
  [/family steak pie/i,  'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80'],
  [/steak pie/i,         'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80'],
  [/scotch pie/i,        'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80'],
  [/potato scone/i,      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80'],

  // ── Breakfast & Sides ─────────────────────────────────────────────────────
  [/square slice|lorne/i,'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  [/sweetcure bacon|bacon/i,'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'],
  [/black pudding/i,     'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  [/haggis/i,            'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  [/fruit pudding/i,     'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  [/egg/i,               'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80'],

  // ── Meat packs (all share the same category image) ────────────────────────
  [/pack|special|saver|muscle|fit pack|bbq/i,
                         'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
];

// Per-category fallback if no name pattern matches (meat-packs category is handled above via name)
const CATEGORY_FALLBACKS: Record<string, string> = {
  beef:               'https://images.unsplash.com/photo-1546964124-0cce460e0700?w=800&q=80',
  pork:               'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  chicken:            'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  fish:               'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'sausages-burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'pies-bakery':      'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80',
  'breakfast-sides':  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  'meat-packs':       'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80',
};

function pickImage(name: string, catSlug: string | null | undefined): string | null {
  for (const [pattern, url] of PRODUCT_IMAGES) {
    if (pattern.test(name)) return url;
  }
  return catSlug ? CATEGORY_FALLBACKS[catSlug] ?? null : null;
}

async function main() {
  console.log('📸  Assigning stock images to products without photos…');

  const allCats = await db.select().from(categories);
  const slugById = new Map(allCats.map((c) => [c.id, c.slug]));

  const noImage = await db.select().from(products).where(isNull(products.imageUrl));
  console.log(`  Found ${noImage.length} products without an image.`);

  let updated = 0;
  let skipped = 0;

  for (const product of noImage) {
    const catSlug = product.categoryId ? slugById.get(product.categoryId) : null;
    const imageUrl = pickImage(product.name, catSlug);
    if (!imageUrl) {
      console.log(`  ⚠  Skipped "${product.name}" — no match found`);
      skipped++;
      continue;
    }
    await db
      .update(products)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(products.id, product.id));
    console.log(`  ✓  "${product.name}"`);
    updated++;
  }

  console.log(`\n✅  Updated ${updated} products.${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
  console.log('   Replace any image via Admin → Products → edit product → Upload image.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

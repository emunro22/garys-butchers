/**
 * Assigns stock Unsplash images to products that currently have no imageUrl.
 * Safe to re-run — only touches rows where imageUrl IS NULL.
 *
 * Run with:  npm run db:images
 *
 * When you have real photos, replace them via Admin → Products → edit product → upload image.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './index';
import { products, categories } from './schema';
import { eq, isNull } from 'drizzle-orm';

// One representative stock photo per category slug.
// All photos from Unsplash (https://unsplash.com) — free to use under the Unsplash licence.
const CATEGORY_IMAGES: Record<string, string> = {
  beef: 'https://images.unsplash.com/photo-1546964124-0cce460e0700?w=800&q=80',
  pork: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'sausages-burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'pies-bakery': 'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80',
  'breakfast-sides': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  'meat-packs': 'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80',
};

async function main() {
  console.log('📸  Assigning stock images to products without photos…');

  const allCats = await db.select().from(categories);
  const slugById = new Map(allCats.map((c) => [c.id, c.slug]));

  const noImage = await db.select().from(products).where(isNull(products.imageUrl));
  console.log(`  Found ${noImage.length} products without an image.`);

  let updated = 0;
  for (const product of noImage) {
    const catSlug = product.categoryId ? slugById.get(product.categoryId) : null;
    const imageUrl = catSlug ? CATEGORY_IMAGES[catSlug] ?? null : null;
    if (!imageUrl) {
      console.log(`  ⚠  Skipped "${product.name}" — no image for category "${catSlug ?? 'none'}"`);
      continue;
    }
    await db
      .update(products)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(products.id, product.id));
    updated++;
  }

  console.log(`✅  Updated ${updated} products with stock images.`);
  console.log('   Replace any image via Admin → Products → edit product → Upload image.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import type { MetadataRoute } from 'next';
import { catalogDb } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { recipes } from '@/lib/recipes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const staticRoutes = [
  { path: '', changeFrequency: 'daily' as const, priority: 1 },
  { path: '/shop', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/shop/meat-packs', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/reviews', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/recipes', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/subscriptions/build', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  for (const post of recipes) {
    entries.push({
      url: `${SITE_URL}/recipes/${post.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  try {
    const [cats, prods] = await Promise.all([
      catalogDb
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.isActive, true)),
      catalogDb
        .select({ slug: products.slug, updatedAt: products.updatedAt, isPack: products.isPack })
        .from(products)
        .where(eq(products.isActive, true)),
    ]);

    for (const cat of cats) {
      entries.push({
        url: `${SITE_URL}/shop/${cat.slug}`,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }

    for (const prod of prods) {
      entries.push({
        url: prod.isPack
          ? `${SITE_URL}/shop/meat-packs/${prod.slug}`
          : `${SITE_URL}/product/${prod.slug}`,
        lastModified: prod.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // DB not reachable at build time — ship the static routes only.
  }

  return entries;
}

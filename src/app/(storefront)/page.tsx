import { db } from '@/lib/db';
import { products, reviews, categories } from '@/lib/db/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { getCategoryImageMap } from '@/lib/db/category-images';
import { Hero } from '@/components/home/hero';
import { FeaturedCategories } from '@/components/home/featured-categories';
import { FeaturedPacks } from '@/components/home/featured-packs';
import { Reviews } from '@/components/home/reviews';
import { ReviewsStrip } from '@/components/home/reviews-strip';
import { AboutStrip } from '@/components/home/about-strip';
import { DeliveryStrip } from '@/components/home/delivery-strip';
import { SeasonalDeals } from '@/components/home/seasonal-deals';

export const revalidate = 60;

async function getHomepageData() {
  try {
    const [packsRes, packCountRes, reviewsRes, catsRes, categoryImages] = await Promise.all([
      db
        .select()
        .from(products)
        .where(eq(products.isPack, true))
        .orderBy(desc(products.isFeatured))
        .limit(6),
      db
        .select({ value: count() })
        .from(products)
        .where(and(eq(products.isPack, true), eq(products.isActive, true))),
      db
        .select()
        .from(reviews)
        .where(eq(reviews.isFeatured, true))
        .orderBy(desc(reviews.publishedAt))
        .limit(6),
      db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder)),
      getCategoryImageMap(),
    ]);
    const cats = catsRes.map((c) => ({ ...c, imageUrl: categoryImages[c.id] ?? null }));
    return { packs: packsRes, packCount: packCountRes[0]?.value ?? 0, reviews: reviewsRes, cats };
  } catch {
    return { packs: [], packCount: 0, reviews: [], cats: [] };
  }
}

export default async function HomePage() {
  const { packs, packCount, reviews: reviewsData, cats } = await getHomepageData();

  return (
    <>
      <Hero />
      <FeaturedCategories categories={cats} />
      <ReviewsStrip />
      <DeliveryStrip />
      <SeasonalDeals />
      {packs.length > 0 && <FeaturedPacks packs={packs} packCount={packCount} />}
      <AboutStrip />
      {reviewsData.length > 0 && <Reviews reviews={reviewsData} />}
    </>
  );
}

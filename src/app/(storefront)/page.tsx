import { db } from '@/lib/db';
import { products, reviews, categories } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { Hero } from '@/components/home/hero';
import { FeaturedCategories } from '@/components/home/featured-categories';
import { FeaturedPacks } from '@/components/home/featured-packs';
import { Reviews } from '@/components/home/reviews';
import { AboutStrip } from '@/components/home/about-strip';
import { DeliveryStrip } from '@/components/home/delivery-strip';
import { SeasonalDeals } from '@/components/home/seasonal-deals';

export const revalidate = 60;

async function getHomepageData() {
  try {
    const [packsRes, reviewsRes, catsRes] = await Promise.all([
      db
        .select()
        .from(products)
        .where(eq(products.isPack, true))
        .orderBy(desc(products.isFeatured))
        .limit(6),
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
    ]);
    return { packs: packsRes, reviews: reviewsRes, cats: catsRes };
  } catch {
    return { packs: [], reviews: [], cats: [] };
  }
}

export default async function HomePage() {
  const { packs, reviews: reviewsData, cats } = await getHomepageData();

  return (
    <>
      <Hero />
      <DeliveryStrip />
      <SeasonalDeals />
      <FeaturedCategories categories={cats} />
      {packs.length > 0 && <FeaturedPacks packs={packs} />}
      <AboutStrip />
      {reviewsData.length > 0 && <Reviews reviews={reviewsData} />}
    </>
  );
}

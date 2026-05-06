import { db } from '@/lib/db';
import { products, reviews, categories } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Hero } from '@/components/home/hero';
import { FeaturedCategories } from '@/components/home/featured-categories';
import { FeaturedPacks } from '@/components/home/featured-packs';
import { Reviews } from '@/components/home/reviews';
import { AboutStrip } from '@/components/home/about-strip';
import { DeliveryStrip } from '@/components/home/delivery-strip';

export const revalidate = 60;

async function getHomepageData() {
  // Try to read from DB; fallback to empty arrays so the page still renders before seed
  try {
    const [packsRes, reviewsRes] = await Promise.all([
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
    ]);
    return { packs: packsRes, reviews: reviewsRes };
  } catch {
    return { packs: [], reviews: [] };
  }
}

export default async function HomePage() {
  const { packs, reviews } = await getHomepageData();

  return (
    <>
      <Hero />
      <DeliveryStrip />
      <FeaturedCategories />
      {packs.length > 0 && <FeaturedPacks packs={packs} />}
      <AboutStrip />
      {reviews.length > 0 && <Reviews reviews={reviews} />}
    </>
  );
}

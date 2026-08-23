import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { CustomerSessionProvider } from '@/components/account/session-provider';
import { AnalyticsTracker } from '@/components/layout/analytics-tracker';
import { SeasonalThemeProvider } from '@/components/seasonal/seasonal-theme-context';
import { SeasonalBanner } from '@/components/seasonal/seasonal-banner';
import { SeasonalEffects } from '@/components/seasonal/seasonal-effects';
import { catalogDb } from '@/lib/db';
import { categories, reviews } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { eq, asc, desc } from 'drizzle-orm';
import { buildLocalBusinessJsonLd } from '@/lib/structured-data';

export const revalidate = 60;

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  let cats: { name: string; slug: string }[] = [];
  let allReviews: { authorName: string; rating: number; body: string; publishedAt: Date }[] = [];
  try {
    cats = await catalogDb
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
  } catch {
    // Database not yet migrated — fall back to empty nav
  }

  try {
    allReviews = await catalogDb
      .select({
        authorName: reviews.authorName,
        rating: reviews.rating,
        body: reviews.body,
        publishedAt: reviews.publishedAt,
      })
      .from(reviews)
      .orderBy(desc(reviews.publishedAt));
  } catch {
    // Database not yet migrated — fall back to no reviews
  }

  const { seasonal, shop } = await getShopSettings();
  const theme = seasonal.theme;

  const averageRating =
    allReviews.length === 0
      ? 5
      : allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  const localBusinessJsonLd = buildLocalBusinessJsonLd({
    name: shop.name,
    address: shop.address,
    phone: shop.phone,
    reviews: allReviews.slice(0, 5),
    reviewCount: allReviews.length,
    averageRating,
  });

  return (
    <div data-theme={theme === 'none' ? undefined : theme}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <SeasonalThemeProvider theme={theme}>
        <CustomerSessionProvider>
          <AnalyticsTracker />
          <SeasonalBanner theme={theme} />
          <AnnouncementBar />
          <Header categories={cats} />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <CartDrawer />
          <SeasonalEffects theme={theme} />
        </CustomerSessionProvider>
      </SeasonalThemeProvider>
    </div>
  );
}

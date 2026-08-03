import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { CustomerSessionProvider } from '@/components/account/session-provider';
import { AnalyticsTracker } from '@/components/layout/analytics-tracker';
import { SeasonalThemeProvider } from '@/components/seasonal/seasonal-theme-context';
import { SeasonalBanner } from '@/components/seasonal/seasonal-banner';
import { SeasonalEffects } from '@/components/seasonal/seasonal-effects';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { eq, asc } from 'drizzle-orm';

export const revalidate = 60;

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  let cats: { name: string; slug: string }[] = [];
  try {
    cats = await db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
  } catch {
    // Database not yet migrated — fall back to empty nav
  }

  const { seasonal } = await getShopSettings();
  const theme = seasonal.theme;

  return (
    <div data-theme={theme === 'none' ? undefined : theme}>
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

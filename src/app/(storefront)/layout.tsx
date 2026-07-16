import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { CustomerSessionProvider } from '@/components/account/session-provider';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
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

  return (
    <CustomerSessionProvider>
      <AnnouncementBar />
      <Header categories={cats} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
    </CustomerSessionProvider>
  );
}

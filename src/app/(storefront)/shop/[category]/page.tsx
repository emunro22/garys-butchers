import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { ProductCard } from '@/components/shop/product-card';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  try {
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (!cat) return { title: 'Not found' };
    return {
      title: `${cat.name} — Gary’s Butchers & Fishmongers`,
      description: cat.description ?? `Shop ${cat.name} at Gary's Butchers & Fishmongers.`,
    };
  } catch {
    return { title: 'Shop' };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  let cat: any = null;
  let items: any[] = [];
  let allCats: any[] = [];

  try {
    [cat] = await db.select().from(categories).where(eq(categories.slug, category)).limit(1);
    if (!cat) notFound();
    items = await db
      .select()
      .from(products)
      .where(and(eq(products.categoryId, cat.id), eq(products.isActive, true)))
      .orderBy(asc(products.name));
    allCats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
  } catch (err) {
    if (!cat) notFound();
  }

  return (
    <div className="bg-cream-50">
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <nav className="text-xs uppercase tracking-[0.22em] text-cream-200/60 mb-6">
            <Link href="/shop" className="hover:text-gold-400">
              Shop
            </Link>
            <span className="mx-3">/</span>
            <span className="text-gold-400">{cat.name}</span>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">{cat.name}</h1>
          {cat.description && (
            <p className="mt-6 max-w-2xl text-cream-200/80 leading-relaxed">
              {cat.description}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/shop"
            className="px-4 py-2 text-xs uppercase tracking-[0.18em] border border-ink-900/15 hover:border-ink-900 transition-colors"
          >
            All
          </Link>
          {allCats.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-colors ${
                c.id === cat.id
                  ? 'bg-ink-900 text-cream-50 border-ink-900'
                  : 'border-ink-900/15 hover:border-ink-900'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-ink-700">Nothing here yet.</p>
            <p className="text-ink-500 mt-2">
              We&apos;re still stocking this counter — check back soon.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-6 text-sm uppercase tracking-[0.2em] text-ink-900 underline underline-offset-4"
            >
              Back to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { and, eq, ne, asc } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { AddToCartButton } from '@/components/shop/add-to-cart-button';
import { ProductCard } from '@/components/shop/product-card';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!p) return { title: 'Not found' };
    return {
      title: `${p.name} — Gary's Butchers & Fishmongers`,
      description: p.description ?? `${p.name}, hand-cut at Gary's Butchers & Fishmongers.`,
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: any = null;
  let category: any = null;
  let related: any[] = [];

  try {
    [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!product) notFound();
    if (product.categoryId) {
      [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1);
      related = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.categoryId, product.categoryId),
            ne(products.id, product.id),
            eq(products.isActive, true)
          )
        )
        .orderBy(asc(products.name))
        .limit(4);
    }
  } catch {
    if (!product) notFound();
  }

  const onSale =
    product.compareAtPriceInPence && product.compareAtPriceInPence > product.priceInPence;

  return (
    <div className="bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8 md:pt-10">
        {/* Breadcrumb */}
        <nav className="text-xs uppercase tracking-[0.22em] text-ink-500 mb-8">
          <Link href="/shop" className="hover:text-ink-900">
            Shop
          </Link>
          {category && (
            <>
              <span className="mx-3">/</span>
              <Link href={`/shop/${category.slug}`} className="hover:text-ink-900">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-3">/</span>
          <span className="text-ink-900">{product.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-[4/5] bg-ink-900/5 overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-900 text-gold-400/40">
                <svg className="h-24 w-24" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="32" cy="32" r="28" />
                </svg>
              </div>
            )}
            {product.badge && (
              <span className="absolute top-4 left-4 bg-gold-400 text-ink-900 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5">
                {product.badge}
              </span>
            )}
            {onSale && (
              <span className="absolute top-4 right-4 bg-butcher-500 text-cream-50 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5">
                On offer
              </span>
            )}
          </div>

          {/* Detail */}
          <div className="lg:pt-8">
            {category && (
              <p className="eyebrow text-ink-500 mb-3">{category.name}</p>
            )}
            <h1 className="font-display text-4xl md:text-5xl text-ink-900 leading-[1.05]">
              {product.name}
            </h1>

            <div className="mt-6 flex items-baseline gap-3">
              <p className="font-display text-3xl text-ink-900 tabular">
                {formatPrice(product.priceInPence)}
              </p>
              {onSale && (
                <p className="text-base text-ink-400 line-through tabular">
                  {formatPrice(product.compareAtPriceInPence!)}
                </p>
              )}
            </div>
            {product.weightLabel && (
              <p className="text-sm text-ink-500 mt-2">{product.weightLabel}</p>
            )}

            {product.description && (
              <p className="mt-8 text-ink-700 leading-relaxed max-w-prose">
                {product.description}
              </p>
            )}

            <div className="mt-10">
              <AddToCartButton product={product} />
            </div>

            {/* Trust strip */}
            <ul className="mt-10 grid gap-3 text-sm text-ink-700 border-t border-ink-900/10 pt-8">
              <li className="flex items-start gap-3">
                <span className="text-gold-500 mt-0.5">●</span>
                Cut fresh by hand the day it&apos;s prepared.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-500 mt-0.5">●</span>
                Free home delivery on orders over £25 in our local area.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-500 mt-0.5">●</span>
                Click &amp; collect from our Erskine shop, no charge.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-ink-900/10 bg-cream-100">
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-20">
            <p className="eyebrow text-ink-500 mb-2">More from {category?.name}</p>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 mb-10">
              You might also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

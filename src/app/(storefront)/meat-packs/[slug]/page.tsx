import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, ne, asc } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { AddToCartButton } from '@/components/shop/add-to-cart-button';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [p] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isPack, true)))
      .limit(1);
    if (!p) return { title: 'Not found' };
    return {
      title: `${p.name} — Gary's Meat Packs`,
      description: p.description ?? `${p.name} from Gary's Butchers — full contents and pricing.`,
    };
  } catch {
    return { title: 'Meat pack' };
  }
}

export default async function MeatPackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let pack: any = null;
  let otherPacks: any[] = [];

  try {
    [pack] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isPack, true)))
      .limit(1);
    if (!pack) notFound();
    otherPacks = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isPack, true),
          eq(products.isActive, true),
          ne(products.id, pack.id)
        )
      )
      .orderBy(asc(products.priceInPence))
      .limit(3);
  } catch {
    if (!pack) notFound();
  }

  const contents = (pack.packContents as string[]) ?? [];

  return (
    <div>
      {/* Hero with dark background */}
      <section className="bg-ink-900 text-cream-50 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(201,169,97,0.5) 12px, rgba(201,169,97,0.5) 13px)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 pt-10">
          <nav className="text-xs uppercase tracking-[0.22em] text-cream-200/60">
            <Link href="/meat-packs" className="hover:text-gold-400">
              Meat packs
            </Link>
            <span className="mx-3">/</span>
            <span className="text-gold-400">{pack.name}</span>
          </nav>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-20 grid lg:grid-cols-[1fr_1.3fr] gap-12 items-start">
          {/* Image / plate */}
          <div className="relative aspect-square bg-ink-800 border border-gold-400/20">
            {pack.imageUrl ? (
              <Image
                src={pack.imageUrl}
                alt={pack.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="font-display text-6xl text-gold-400 mb-4">★</div>
                  <p className="eyebrow text-gold-400">Gary&apos;s Pack</p>
                  <p className="font-display text-2xl text-cream-50 mt-2">{pack.name}</p>
                </div>
              </div>
            )}
            {pack.badge && (
              <span className="absolute top-4 left-4 bg-gold-400 text-ink-900 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5">
                {pack.badge}
              </span>
            )}
          </div>

          {/* Detail */}
          <div>
            <p className="eyebrow text-gold-400 mb-3">Family value pack</p>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.95]">{pack.name}</h1>

            {pack.description && (
              <p className="mt-6 text-cream-200/80 leading-relaxed max-w-prose">
                {pack.description}
              </p>
            )}

            <div className="mt-8 flex items-baseline gap-4">
              <p className="font-display text-5xl text-gold-400 tabular">
                {formatPrice(pack.priceInPence)}
              </p>
              {pack.compareAtPriceInPence && (
                <p className="text-lg text-cream-200/40 line-through tabular">
                  {formatPrice(pack.compareAtPriceInPence)}
                </p>
              )}
            </div>

            {/* Contents in two-column menu plate */}
            <div className="mt-10 border-y border-gold-400/20 py-8">
              <p className="eyebrow text-gold-400 mb-5">What&apos;s inside · {contents.length} items</p>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-cream-100">
                {contents.map((line, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="text-gold-400 text-xs">●</span>
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <AddToCartButton product={pack} variant="dark" />
            </div>

            <p className="mt-6 text-xs text-cream-200/50">
              Free home delivery available on orders over £25 in the local area. Click &amp;
              collect from our Erskine shop, no charge.
            </p>
          </div>
        </div>
      </section>

      {/* Other packs */}
      {otherPacks.length > 0 && (
        <section className="bg-cream-50 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 mb-10">
              Other packs you might like
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {otherPacks.map((p) => (
                <Link
                  key={p.id}
                  href={`/meat-packs/${p.slug}`}
                  className="group bg-cream-100 border border-ink-900/10 hover:border-gold-500 transition-colors p-6"
                >
                  <p className="eyebrow text-ink-500 mb-2">Pack</p>
                  <h3 className="font-display text-2xl text-ink-900">{p.name}</h3>
                  <p className="font-display text-2xl text-gold-600 mt-3 tabular">
                    {formatPrice(p.priceInPence)}
                  </p>
                  <span className="mt-4 inline-flex text-xs uppercase tracking-[0.22em] text-ink-900 items-center gap-2 group-hover:text-gold-600">
                    See pack
                    <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

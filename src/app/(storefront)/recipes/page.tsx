import Link from 'next/link';
import type { Metadata } from 'next';
import { recipes } from '@/lib/recipes';

export const metadata: Metadata = {
  title: 'Recipes & Sourcing',
  description:
    'Cooking guides, recipes and sourcing stories from our butcher and fishmonger counter in Erskine: hand-cut Scottish meat, cooked simply.',
  alternates: { canonical: '/recipes' },
};

export default function RecipesIndexPage() {
  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">From the counter</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            Recipes
            <span className="font-display italic text-gold-400"> &amp; sourcing.</span>
          </h1>
          <p className="mt-6 text-cream-200/80 max-w-xl leading-relaxed">
            Cooking guides and stories from Gary and the team: how we choose what goes
            on the counter, and how to cook it once it's home.
          </p>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {recipes.map((post) => (
              <Link
                key={post.slug}
                href={`/recipes/${post.slug}`}
                className="group block border border-ink-900/10 hover:border-gold-400 transition-colors p-8"
              >
                <p className="eyebrow text-ink-500 mb-3">{post.eyebrow}</p>
                <h2 className="font-display text-2xl text-ink-900 leading-tight group-hover:text-gold-700 transition-colors">
                  {post.title}
                </h2>
                <p className="mt-4 text-sm text-ink-700 leading-relaxed">{post.standfirst}</p>
                <p className="mt-6 text-xs uppercase tracking-[0.18em] text-ink-500">
                  {post.readTime}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { recipes, getRecipeBySlug } from '@/lib/recipes';

export function generateStaticParams() {
  return recipes.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getRecipeBySlug(slug);
  if (!post) return { title: 'Not found' };
  return {
    title: post.title,
    description: post.standfirst,
    alternates: { canonical: `/recipes/${slug}` },
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getRecipeBySlug(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const url = `${siteUrl}/recipes/${post.slug}`;

  const jsonLd = post.recipe
    ? {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: post.title,
        description: post.standfirst,
        datePublished: post.publishedAt,
        author: { '@type': 'Organization', name: "Gary's Butchers & Fishmongers" },
        prepTime: post.recipe.prepTime,
        cookTime: post.recipe.cookTime,
        totalTime: post.recipe.totalTime,
        recipeYield: post.recipe.recipeYield,
        recipeIngredient: post.recipe.ingredients,
        recipeInstructions: post.recipe.instructions.map((step) => ({
          '@type': 'HowToStep',
          text: step,
        })),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.standfirst,
        datePublished: post.publishedAt,
        author: { '@type': 'Organization', name: "Gary's Butchers & Fishmongers" },
        mainEntityOfPage: url,
      };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <nav className="text-xs uppercase tracking-[0.2em] text-cream-200/60 mb-6">
            <Link href="/recipes" className="hover:text-cream-50">
              Recipes
            </Link>
            <span className="mx-3">/</span>
            <span className="text-gold-400">{post.eyebrow}</span>
          </nav>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05]">{post.title}</h1>
          <p className="mt-6 text-cream-200/80 leading-relaxed max-w-xl">{post.standfirst}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gold-400">
            {post.readTime}
          </p>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8 space-y-10">
          {post.body.map((block, i) => (
            <div key={i}>
              {block.heading && (
                <h2 className="font-display text-2xl md:text-3xl text-ink-900 mb-4">
                  {block.heading}
                </h2>
              )}
              <div className="space-y-4 text-ink-700 leading-relaxed">
                {block.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          ))}

          {post.recipe && (
            <div className="grid sm:grid-cols-2 gap-10 border-t border-ink-900/10 pt-10">
              <div>
                <h2 className="font-display text-2xl text-ink-900 mb-4">Ingredients</h2>
                <ul className="space-y-2 text-ink-700 text-sm">
                  {post.recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-gold-500 mt-0.5">●</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-display text-2xl text-ink-900 mb-4">Method</h2>
                <ol className="space-y-3 text-ink-700 text-sm">
                  {post.recipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-ink-400 tabular shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <div className="border-t border-ink-900/10 pt-8 flex flex-wrap gap-3">
            {post.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.16em] font-medium text-ink-900 border border-ink-900/20 hover:border-gold-400 px-4 py-2.5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

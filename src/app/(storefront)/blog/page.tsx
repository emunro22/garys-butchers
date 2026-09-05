import Link from 'next/link';
import type { Metadata } from 'next';
import { blogPosts } from '@/lib/blogPosts';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Cut guides, ordering tips and storage advice from Gary\'s Butchers & Fishmongers in Erskine, hand-cut Scottish meat, explained simply.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndexPage() {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">From the shop</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            Blog
            <span className="font-display italic text-gold-400"> &amp; guides.</span>
          </h1>
          <p className="mt-6 text-cream-200/80 max-w-xl leading-relaxed">
            Cut guides, ordering tips and straightforward advice from Gary and the team,
            grounded in what we actually sell and how we actually work.
          </p>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="grid gap-8 sm:grid-cols-2">
            {sorted.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-ink-900/10 bg-white p-6 hover:border-gold-400 transition-colors"
              >
                <p className="eyebrow text-gold-600 mb-3">{post.category}</p>
                <h2 className="font-display text-2xl text-ink-900 leading-tight mb-3 group-hover:text-gold-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-ink-500 leading-relaxed mb-4">{post.excerpt}</p>
                <p className="text-xs uppercase tracking-[0.15em] text-ink-400">
                  {new Date(post.publishDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

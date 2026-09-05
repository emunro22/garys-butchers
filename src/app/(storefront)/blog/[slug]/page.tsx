import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { blogPosts, getBlogPostBySlug } from '@/lib/blogPosts';
import { BlogBody } from '@/components/blog/blog-body';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: 'Not found' };
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const url = `${siteUrl}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    author: { '@type': 'Organization', name: "Gary's Butchers & Fishmongers" },
    publisher: { '@type': 'Organization', name: "Gary's Butchers & Fishmongers" },
    mainEntityOfPage: url,
  };

  const others = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <nav className="text-xs uppercase tracking-[0.2em] text-cream-200/60 mb-6">
            <Link href="/blog" className="hover:text-cream-50">
              Blog
            </Link>
            <span className="mx-3">/</span>
            <span className="text-gold-400">{post.category}</span>
          </nav>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05]">{post.title}</h1>
          <p className="mt-6 text-cream-200/80 leading-relaxed max-w-xl">{post.excerpt}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gold-400">
            {new Date(post.publishDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8 space-y-10">
          <BlogBody blocks={post.body} />

          {others.length > 0 && (
            <div className="border-t border-ink-900/10 pt-8">
              <p className="eyebrow text-ink-500 mb-4">Read next</p>
              <div className="flex flex-wrap gap-3">
                {others.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="text-xs uppercase tracking-[0.16em] font-medium text-ink-900 border border-ink-900/20 hover:border-gold-400 px-4 py-2.5 transition-colors"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

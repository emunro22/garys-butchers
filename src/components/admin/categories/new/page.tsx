import Link from 'next/link';
import { CategoryForm } from '@/components/admin/category-form';

export default function NewCategoryPage() {
  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/categories"
          className="text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900 mb-3 inline-block"
        >
          ← Categories
        </Link>
        <h1 className="font-display text-4xl text-ink-900">New category</h1>
      </header>
      <CategoryForm mode="create" />
    </div>
  );
}
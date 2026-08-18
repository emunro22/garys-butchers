import { ReviewBackfillForm } from '@/components/admin/review-backfill-form';

export const dynamic = 'force-dynamic';

export default function AdminReviewBackfillPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">One-time send</p>
        <h1 className="font-display text-4xl text-ink-900">Review request backfill</h1>
        <p className="text-ink-500 text-sm mt-2 max-w-prose">
          Sends the &quot;leave us a review&quot; email to every existing customer whose order has
          already been fulfilled. Going forward this happens automatically at 8pm each day an
          order is due — this page is just for catching up on orders placed before that was set
          up. Safe to leave this page here; running it again later only catches anything new.
        </p>
      </header>
      <ReviewBackfillForm />
    </div>
  );
}

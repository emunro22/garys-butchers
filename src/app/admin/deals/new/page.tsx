import { DealForm } from '@/components/admin/deal-form';

export default function NewDealPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Marketing / New deal</p>
        <h1 className="font-display text-4xl text-ink-900">Create deal</h1>
      </header>
      <DealForm mode="create" />
    </div>
  );
}

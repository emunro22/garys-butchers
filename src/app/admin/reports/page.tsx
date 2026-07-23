import { ReportsForm } from '@/components/admin/reports-form';

export const dynamic = 'force-dynamic';

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Insights</p>
        <h1 className="font-display text-4xl text-ink-900">Reports</h1>
        <p className="text-ink-500 text-sm mt-2 max-w-prose">
          Run a report for any period and it&apos;ll be emailed out as a CSV file to the usual
          report recipients.
        </p>
      </header>
      <ReportsForm />
    </div>
  );
}

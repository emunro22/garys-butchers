import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { SettingsForm } from '@/components/admin/settings-form';
import { DEFAULT_SETTINGS } from '@/app/api/settings/route';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const rows = await db.select().from(settings);
  const saved: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    saved[row.key] = row.value;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Configuration</p>
        <h1 className="font-display text-4xl text-ink-900">Settings</h1>
      </header>
      <SettingsForm initial={saved as any} />
    </div>
  );
}

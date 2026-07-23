import { SettingsForm } from '@/components/admin/settings-form';
import { getShopSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const saved = await getShopSettings();

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Configuration</p>
        <h1 className="font-display text-4xl text-ink-900">Settings</h1>
      </header>
      <SettingsForm initial={saved} />
    </div>
  );
}

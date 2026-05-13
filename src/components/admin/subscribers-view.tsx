'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Mail, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

export function SubscribersView({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return subscribers
      .filter((s) => {
        if (filter === 'active' && !s.isActive) return false;
        if (filter === 'inactive' && s.isActive) return false;
        return true;
      })
      .filter(
        (s) =>
          !q ||
          s.email.toLowerCase().includes(q) ||
          (s.name ?? '').toLowerCase().includes(q)
      );
  }, [subscribers, query, filter]);

  const mailtoAll = useMemo(() => {
    const active = filtered.filter((s) => s.isActive);
    if (active.length === 0) return '';
    const emails = active.map((s) => s.email).join(',');
    return `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(
      "An update from Gary's Butchers"
    )}`;
  }, [filtered]);

  async function toggleActive(id: string, current: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error('Update failed');
      router.refresh();
    } catch {
      alert('Could not update subscriber');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete subscriber "${email}"? This can't be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch {
      alert('Could not delete subscriber');
    } finally {
      setBusy(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 bg-cream-100 border border-ink-900/10 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Search by email or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
        >
          <option value="active">Active only</option>
          <option value="all">All</option>
          <option value="inactive">Inactive only</option>
        </select>
        <a href="/api/subscribers/export" download>
          <Button variant="outline" type="button">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </a>
        {mailtoAll && (
          <a href={mailtoAll}>
            <Button variant="primary" type="button">
              <Mail className="h-4 w-4 mr-2" /> Email {filtered.filter((s) => s.isActive).length}
            </Button>
          </a>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-ink-500">
          {subscribers.length === 0
            ? "No subscribers yet — they'll appear here once people sign up from the website."
            : 'No subscribers match those filters.'}
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="bg-cream-100 border border-ink-900/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {s.name && (
                      <p className="font-medium text-ink-900 truncate">{s.name}</p>
                    )}
                    <a
                      href={`mailto:${s.email}`}
                      className="text-sm text-ink-700 hover:text-gold-700 break-all"
                    >
                      {s.email}
                    </a>
                    <p className="text-xs text-ink-500 mt-1">
                      Joined {formatDate(s.subscribedAt)} · {s.source}
                    </p>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                      s.isActive ? 'bg-green-500' : 'bg-ink-300'
                    }`}
                  />
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-ink-900/5">
                  <button
                    onClick={() => toggleActive(s.id, s.isActive)}
                    disabled={busy === s.id}
                    className="flex-1 text-xs uppercase tracking-[0.18em] py-2 border border-ink-900/15 hover:border-ink-900 disabled:opacity-50"
                  >
                    {s.isActive ? 'Unsubscribe' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.email)}
                    disabled={busy === s.id}
                    className="px-3 py-2 border border-butcher-500/30 text-butcher-500 hover:bg-butcher-500/5 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-cream-100 border border-ink-900/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-ink-900/10">
                <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-center">Active</th>
                  <th className="px-5 py-3 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50">
                    <td className="px-5 py-3">
                      <a
                        href={`mailto:${s.email}`}
                        className="text-ink-900 hover:text-gold-700"
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{s.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-ink-500">
                        {s.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{formatDate(s.subscribedAt)}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          s.isActive ? 'bg-green-500' : 'bg-ink-300'
                        }`}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(s.id, s.isActive)}
                          disabled={busy === s.id}
                          className="text-xs uppercase tracking-[0.18em] hover:text-ink-900 text-ink-500 disabled:opacity-50"
                        >
                          {s.isActive ? 'Unsubscribe' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.email)}
                          disabled={busy === s.id}
                          className="p-2 hover:bg-butcher-500/10 hover:text-butcher-500 transition-colors disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-ink-500">
        Export to CSV to import into Mailchimp, Brevo, or another mailing tool. The
        <strong> Email</strong> button opens your default mail app with everyone BCC&apos;d.
      </p>
    </div>
  );
}
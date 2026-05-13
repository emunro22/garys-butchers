'use client';

import { useMemo, useState } from 'react';
import { Search, Download, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

type Customer = {
  email: string;
  name: string;
  phone: string | null;
  orderCount: number;
  totalSpentInPence: number;
  firstOrder: string;
  lastOrder: string;
};

export function CustomersView({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.name ?? '').toLowerCase().includes(q)
    );
  }, [customers, query]);

  const mailtoAll = useMemo(() => {
    if (filtered.length === 0) return '';
    const emails = filtered.map((c) => c.email).join(',');
    return `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(
      "An update from Gary's Butchers"
    )}`;
  }, [filtered]);

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
        <a href="/api/customers/export" download>
          <Button variant="outline" type="button">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </a>
        {mailtoAll && (
          <a href={mailtoAll}>
            <Button variant="primary" type="button">
              <Mail className="h-4 w-4 mr-2" /> Email {filtered.length}
            </Button>
          </a>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-ink-500">
          {customers.length === 0
            ? "No customers yet — once orders come in they'll appear here."
            : 'No customers match your search.'}
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((c) => (
              <div key={c.email} className="bg-cream-100 border border-ink-900/10 p-4">
                <p className="font-medium text-ink-900 truncate">{c.name}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="text-xs text-ink-700 hover:text-gold-700 break-all"
                >
                  {c.email}
                </a>
                {c.phone && (
                  <p className="text-xs text-ink-500 mt-0.5 tabular">{c.phone}</p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ink-900/5 text-xs">
                  <div>
                    <p className="eyebrow text-ink-500 mb-0.5 text-[9px]">Orders</p>
                    <p className="font-medium text-ink-900 tabular">{c.orderCount}</p>
                  </div>
                  <div>
                    <p className="eyebrow text-ink-500 mb-0.5 text-[9px]">Spent</p>
                    <p className="font-medium text-ink-900 tabular">
                      {formatPrice(c.totalSpentInPence)}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow text-ink-500 mb-0.5 text-[9px]">Last</p>
                    <p className="font-medium text-ink-900">{formatDate(c.lastOrder)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-cream-100 border border-ink-900/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-ink-900/10">
                <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Total spent</th>
                  <th className="px-5 py-3">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {filtered.map((c) => (
                  <tr key={c.email} className="hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink-900">{c.name}</td>
                    <td className="px-5 py-3">
                      <a
                        href={`mailto:${c.email}`}
                        className="text-ink-700 hover:text-gold-700"
                      >
                        {c.email}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-ink-500 tabular">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-right tabular">{c.orderCount}</td>
                    <td className="px-5 py-3 text-right tabular font-medium">
                      {formatPrice(c.totalSpentInPence)}
                    </td>
                    <td className="px-5 py-3 text-ink-700">{formatDate(c.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-ink-500">
        Use the <strong>Export CSV</strong> button to import this list into Mailchimp, Brevo, or any other mailing tool.
      </p>
    </div>
  );
}
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  TicketPercent,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/promotions', label: 'Promotions', icon: TicketPercent },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-ink-900 text-cream-50 sticky top-0 h-screen">
        <div className="p-6 border-b border-gold-400/15 flex items-center gap-3">
          <div className="relative h-9 w-9">
            <Image src="/logo.png" alt="" fill className="object-contain" />
          </div>
          <div>
            <p className="eyebrow text-gold-400 text-[10px]">Gary&apos;s</p>
            <p className="font-display text-lg leading-none">Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-gold-400/10 text-gold-400 border-l-2 border-gold-400'
                    : 'text-cream-200/80 hover:bg-cream-50/5 hover:text-cream-50 border-l-2 border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gold-400/15">
          <p className="text-xs text-cream-200/50 px-3 py-1 truncate">{email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream-200/80 hover:bg-butcher-500/10 hover:text-butcher-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-ink-900 text-cream-50 px-4 h-14 flex items-center justify-between border-b border-gold-400/20">
        <div className="flex items-center gap-2">
          <div className="relative h-7 w-7">
            <Image src="/logo.png" alt="" fill className="object-contain" />
          </div>
          <p className="font-display text-base">Admin</p>
        </div>
        <button onClick={handleLogout} className="text-xs uppercase tracking-[0.18em] text-gold-400">
          Sign out
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-0 pt-14 md:pt-0">
        {/* Mobile horizontal nav */}
        <nav className="md:hidden flex overflow-x-auto bg-ink-800 border-b border-gold-400/15 text-cream-50">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 px-4 py-3 text-xs uppercase tracking-[0.18em] ${
                  active ? 'text-gold-400 border-b-2 border-gold-400' : 'text-cream-200/70'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

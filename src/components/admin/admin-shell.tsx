'use client';

import { useState } from 'react';
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
  Users,
  Mail,
  Menu,
  X,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/promotions', label: 'Promotions', icon: TicketPercent },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/subscribers', label: 'Mailing list', icon: Mail },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const currentLabel =
    NAV.find((n) =>
      n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
    )?.label ?? 'Admin';

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Desktop sidebar */}
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
        <button
          onClick={() => setMobileOpen(true)}
          className="h-10 w-10 -ml-2 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <p className="font-display text-base">{currentLabel}</p>
        </div>
        <div className="w-10" aria-hidden />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-ink-900/60 z-40"
            aria-hidden
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-ink-900 text-cream-50 z-50 flex flex-col animate-in slide-in-from-left">
            <div className="p-5 border-b border-gold-400/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8">
                  <Image src="/logo.png" alt="" fill className="object-contain" />
                </div>
                <div>
                  <p className="eyebrow text-gold-400 text-[10px]">Gary&apos;s</p>
                  <p className="font-display text-base leading-none">Admin</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-10 w-10 flex items-center justify-center -mr-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors ${
                      active
                        ? 'bg-gold-400/10 text-gold-400 border-l-2 border-gold-400'
                        : 'text-cream-200/80 hover:bg-cream-50/5 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-gold-400/15">
              <p className="text-xs text-cream-200/50 px-3 py-1 truncate">{email}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-cream-200/80 hover:bg-butcher-500/10 hover:text-butcher-500"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <main className="flex-1 pt-14 md:pt-0 min-w-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
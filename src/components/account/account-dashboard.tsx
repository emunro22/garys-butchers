'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import {
  Package,
  User,
  MapPin,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Heart,
} from 'lucide-react';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  defaultAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  } | null;
  createdAt: string;
};

type OrderItem = {
  productId: string;
  name: string;
  priceInPence: number;
  quantity: number;
  imageUrl?: string;
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  totalInPence: number;
  items: OrderItem[];
  fulfilment: string;
  createdAt: string;
};

type Recommendation = {
  id: string;
  name: string;
  slug: string;
  priceInPence: number;
  imageUrl: string | null;
  badge: string | null;
};

type Tab = 'orders' | 'profile' | 'address';

export function AccountDashboard({
  user,
  orders,
  recommendations,
}: {
  user: UserProfile;
  orders: Order[];
  recommendations: Recommendation[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('orders');
  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone ?? '',
  });
  const [address, setAddress] = useState({
    line1: user.defaultAddress?.line1 ?? '',
    line2: user.defaultAddress?.line2 ?? '',
    city: user.defaultAddress?.city ?? '',
    postcode: user.defaultAddress?.postcode ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleLogout() {
    await fetch('/api/auth/customer-logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  async function saveProfile() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg('Profile updated');
      router.refresh();
    } catch {
      setSaveMsg('Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          defaultAddress: address.line1
            ? { line1: address.line1, line2: address.line2 || undefined, city: address.city, postcode: address.postcode }
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg('Address updated');
      router.refresh();
    } catch {
      setSaveMsg('Could not save');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-cream-50">
      <section className="border-b border-ink-900/10 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-ink-500 mb-3">Welcome back</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900">{user.name.split(' ')[0]}</h1>
          <p className="text-sm text-ink-500 mt-2">{user.email}</p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="space-y-1">
              <button
                onClick={() => { setTab('orders'); setSaveMsg(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  tab === 'orders'
                    ? 'bg-ink-900 text-cream-50'
                    : 'text-ink-700 hover:bg-ink-900/5'
                }`}
              >
                <Package className="h-4 w-4" /> My orders
              </button>
              <button
                onClick={() => { setTab('profile'); setSaveMsg(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  tab === 'profile'
                    ? 'bg-ink-900 text-cream-50'
                    : 'text-ink-700 hover:bg-ink-900/5'
                }`}
              >
                <User className="h-4 w-4" /> My details
              </button>
              <button
                onClick={() => { setTab('address'); setSaveMsg(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  tab === 'address'
                    ? 'bg-ink-900 text-cream-50'
                    : 'text-ink-700 hover:bg-ink-900/5'
                }`}
              >
                <MapPin className="h-4 w-4" /> Saved address
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-500 hover:text-butcher-500 hover:bg-butcher-500/5 transition-colors mt-4"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </aside>

            {/* Content */}
            <div>
              {/* ─── Orders tab ─── */}
              {tab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl text-ink-900">Order history</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-16 bg-cream-100 border border-ink-900/10">
                      <ShoppingBag className="h-10 w-10 text-ink-300 mx-auto mb-4" />
                      <p className="font-display text-xl text-ink-700">No orders yet</p>
                      <p className="text-sm text-ink-500 mt-1">Your orders will appear here once you place one.</p>
                      <Link href="/shop" className="inline-block mt-5">
                        <Button variant="primary">Start shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-cream-100 border border-ink-900/10 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-medium text-ink-900">
                                Order #{String(order.orderNumber).padStart(5, '0')}
                              </p>
                              <p className="text-xs text-ink-500 mt-0.5">
                                {formatDate(order.createdAt)} &middot;{' '}
                                {order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-2 py-1 font-medium uppercase tracking-wider ${
                                  statusColors[order.status] ?? 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status}
                              </span>
                              <p className="font-display text-lg text-ink-900 tabular">
                                {formatPrice(order.totalInPence)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(order.items as OrderItem[]).slice(0, 4).map((item, i) => (
                              <div key={i} className="flex items-center gap-2 bg-cream-50 px-3 py-1.5 text-xs text-ink-700">
                                <span className="font-medium">{item.quantity}x</span>
                                <span className="truncate max-w-[140px]">{item.name}</span>
                              </div>
                            ))}
                            {(order.items as OrderItem[]).length > 4 && (
                              <div className="flex items-center px-3 py-1.5 text-xs text-ink-500">
                                +{(order.items as OrderItem[]).length - 4} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* You may like */}
                  {recommendations.length > 0 && (
                    <div className="mt-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Heart className="h-4 w-4 text-gold-600" />
                        <h3 className="font-display text-xl text-ink-900">You may also like</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {recommendations.map((product) => (
                          <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group bg-cream-100 border border-ink-900/10 hover:border-ink-900/30 transition-colors"
                          >
                            <div className="relative aspect-square bg-ink-900/5">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 25vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-300">
                                  <ShoppingBag className="h-8 w-8" />
                                </div>
                              )}
                              {product.badge && (
                                <span className="absolute top-2 left-2 bg-gold-400 text-ink-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                  {product.badge}
                                </span>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-ink-900 truncate group-hover:text-gold-700 transition-colors">
                                {product.name}
                              </p>
                              <p className="text-sm text-ink-500 tabular mt-0.5">
                                {formatPrice(product.priceInPence)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Profile tab ─── */}
              {tab === 'profile' && (
                <div className="space-y-6 max-w-md">
                  <h2 className="font-display text-2xl text-ink-900">My details</h2>
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="opacity-60" />
                    <p className="text-xs text-ink-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Member since</Label>
                    <p className="text-sm text-ink-700">{formatDate(user.createdAt)}</p>
                  </div>
                  {saveMsg && (
                    <p className={`text-sm px-4 py-3 border ${saveMsg.includes('Could') ? 'text-butcher-500 border-butcher-500/30 bg-butcher-500/5' : 'text-green-700 border-green-200 bg-green-50'}`}>
                      {saveMsg}
                    </p>
                  )}
                  <Button onClick={saveProfile} disabled={saving} variant="primary">
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              )}

              {/* ─── Address tab ─── */}
              {tab === 'address' && (
                <div className="space-y-6 max-w-md">
                  <h2 className="font-display text-2xl text-ink-900">Saved address</h2>
                  <p className="text-sm text-ink-500">
                    This will be auto-filled at checkout when you select delivery.
                  </p>
                  <div>
                    <Label htmlFor="line1">Address line 1</Label>
                    <Input
                      id="line1"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="line2">Address line 2 (optional)</Label>
                    <Input
                      id="line2"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Town / city</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={address.postcode}
                        onChange={(e) => setAddress({ ...address, postcode: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                  {saveMsg && (
                    <p className={`text-sm px-4 py-3 border ${saveMsg.includes('Could') ? 'text-butcher-500 border-butcher-500/30 bg-butcher-500/5' : 'text-green-700 border-green-200 bg-green-50'}`}>
                      {saveMsg}
                    </p>
                  )}
                  <Button onClick={saveAddress} disabled={saving} variant="primary">
                    {saving ? 'Saving…' : 'Save address'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

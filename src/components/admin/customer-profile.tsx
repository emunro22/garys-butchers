'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Package,
} from 'lucide-react';

type CustomerData = {
  id: string;
  type: 'registered' | 'guest';
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  emailVerified: boolean | null;
  defaultAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  } | null;
  createdAt: string;
  totalSpentInPence: number;
  orderCount: number;
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
  deliveryAddress: { line1: string; line2?: string; city: string; postcode: string } | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export function CustomerProfile({
  customer,
  orders,
}: {
  customer: CustomerData;
  orders: Order[];
}) {
  const router = useRouter();
  const [changingRole, setChangingRole] = useState(false);

  async function toggleRole() {
    if (!confirm(`Are you sure you want to ${customer.role === 'admin' ? 'remove admin access from' : 'grant admin access to'} ${customer.name}?`)) return;
    setChangingRole(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: customer.id,
          role: customer.role === 'admin' ? 'customer' : 'admin',
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setChangingRole(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-500 mb-2">
              {customer.type === 'registered' ? 'Registered customer' : 'Guest customer'}
            </p>
            <h1 className="font-display text-4xl text-ink-900">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${customer.email}`} className="hover:text-gold-700">
                  {customer.email}
                </a>
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${customer.phone}`} className="hover:text-gold-700">
                    {customer.phone}
                  </a>
                </span>
              )}
            </div>
          </div>
          {customer.type === 'registered' && (
            <Button
              variant={customer.role === 'admin' ? 'danger' : 'gold'}
              size="sm"
              onClick={toggleRole}
              disabled={changingRole}
            >
              <Crown className="h-4 w-4 mr-1" />
              {changingRole
                ? 'Updating…'
                : customer.role === 'admin'
                ? 'Remove admin'
                : 'Make admin'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-cream-100 border border-ink-900/10 p-4">
          <p className="eyebrow text-ink-500 text-[10px] mb-1">Orders</p>
          <p className="font-display text-2xl text-ink-900 tabular">{customer.orderCount}</p>
        </div>
        <div className="bg-cream-100 border border-ink-900/10 p-4">
          <p className="eyebrow text-ink-500 text-[10px] mb-1">Total spent</p>
          <p className="font-display text-2xl text-ink-900 tabular">
            {formatPrice(customer.totalSpentInPence)}
          </p>
        </div>
        <div className="bg-cream-100 border border-ink-900/10 p-4">
          <p className="eyebrow text-ink-500 text-[10px] mb-1">Customer since</p>
          <p className="text-sm font-medium text-ink-900">{formatDate(customer.createdAt)}</p>
        </div>
        <div className="bg-cream-100 border border-ink-900/10 p-4">
          <p className="eyebrow text-ink-500 text-[10px] mb-1">Status</p>
          <div className="flex items-center gap-2 mt-1">
            {customer.type === 'registered' ? (
              <>
                {customer.emailVerified ? (
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium text-ink-900">
                  {customer.emailVerified ? 'Verified' : 'Unverified'}
                </span>
                {customer.role === 'admin' && (
                  <span className="text-[10px] bg-gold-400 text-ink-900 px-1.5 py-0.5 font-bold uppercase tracking-wider ml-1">
                    Admin
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-ink-500">Guest</span>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      {customer.defaultAddress && (
        <div className="bg-cream-100 border border-ink-900/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-ink-500" />
            <h3 className="eyebrow text-ink-500">
              {customer.type === 'registered' ? 'Saved address' : 'Last delivery address'}
            </h3>
          </div>
          <p className="text-sm text-ink-900">
            {customer.defaultAddress.line1}
            {customer.defaultAddress.line2 && <>, {customer.defaultAddress.line2}</>}
            <br />
            {customer.defaultAddress.city}, {customer.defaultAddress.postcode.toUpperCase()}
          </p>
        </div>
      )}

      {/* Order history */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-ink-500" />
          <h2 className="font-display text-2xl text-ink-900">Order history</h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-ink-500 py-8 text-center bg-cream-100 border border-ink-900/10">
            No orders found.
          </p>
        ) : (
          <div className="bg-cream-100 border border-ink-900/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-ink-900/10">
                <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50">
                    <td className="px-5 py-3 font-medium text-ink-900">
                      #{String(order.orderNumber).padStart(5, '0')}
                    </td>
                    <td className="px-5 py-3 text-ink-700">{formatDateTime(order.createdAt)}</td>
                    <td className="px-5 py-3 text-ink-700">
                      <div className="max-w-[200px]">
                        {(order.items as OrderItem[]).map((item, i) => (
                          <span key={i} className="text-xs">
                            {i > 0 && ', '}
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs uppercase tracking-wider">
                        {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-1 font-medium uppercase tracking-wider ${
                          statusColors[order.status] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular font-medium text-ink-900">
                      {formatPrice(order.totalInPence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) {
          router.push(`/account/verify?email=${encodeURIComponent(data.email)}`);
          return;
        }
        throw new Error(data.error);
      }
      router.push('/account');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-cream-50">
      <section className="border-b border-ink-900/10 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-ink-500 mb-3">Account</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900">Sign in</h1>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-md px-4 md:px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-butcher-500 border border-butcher-500/30 bg-butcher-500/5 px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/account/forgot-password" className="text-ink-500 hover:text-ink-900 transition-colors">
                Forgot password?
              </Link>
              <Link href="/account/signup" className="text-gold-700 hover:text-gold-800 font-medium transition-colors">
                Create account
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

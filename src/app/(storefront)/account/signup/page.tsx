'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/account/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-cream-50">
      <section className="border-b border-ink-900/10 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-ink-500 mb-3">Account</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900">Create account</h1>
          <p className="text-sm text-ink-500 mt-2">
            Track your orders, save your details, and checkout faster.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-md px-4 md:px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
                required
              />
            </div>
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
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <p className="text-xs text-ink-400 mt-1">At least 8 characters</p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-butcher-500 border border-butcher-500/30 bg-butcher-500/5 px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-sm text-ink-500 text-center">
              Already have an account?{' '}
              <Link href="/account/login" className="text-gold-700 hover:text-gold-800 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

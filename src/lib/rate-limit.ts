// Tiny in-memory rate limit (best-effort; resets on each cold start, and is
// per-instance rather than shared across serverless regions — good enough to
// blunt casual brute-forcing, not a substitute for a shared store like Redis
// if this app scales to multiple instances).
const buckets = new Map<string, { count: number; firstAt: number }>();

export function rateLimit(key: string, windowMs: number, maxAttempts: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.firstAt > windowMs) {
    buckets.set(key, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > maxAttempts;
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const ADMIN_SESSION_COOKIE = 'garys_session';
const CUSTOMER_SESSION_COOKIE = 'garys_customer_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.');
  }
  return new TextEncoder().encode(secret);
}

export type AdminSession = {
  email: string;
  role: 'admin';
};

export type CustomerSession = {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
};

// Keep backward-compatible Session type for admin
export type Session = AdminSession;

async function signToken(payload: Record<string, unknown>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

// ─── Admin session helpers ────────────────────────────────────────────

export async function signSession(payload: AdminSession): Promise<string> {
  return signToken(payload as unknown as Record<string, unknown>);
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  return verifyToken<AdminSession>(token);
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function verifyAdminLogin(email: string, password: string): Promise<boolean> {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedEmail || !hash) return false;
  if (email.toLowerCase() !== expectedEmail.toLowerCase()) return false;
  return bcrypt.compare(password, hash);
}

// ─── Customer session helpers ─────────────────────────────────────────

export async function signCustomerSession(payload: CustomerSession): Promise<string> {
  return signToken(payload as unknown as Record<string, unknown>);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<CustomerSession>(token);
}

export async function setCustomerSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

// ─── Shared helpers ───────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const SESSION_COOKIE_NAME = ADMIN_SESSION_COOKIE;
export const CUSTOMER_COOKIE_NAME = CUSTOMER_SESSION_COOKIE;

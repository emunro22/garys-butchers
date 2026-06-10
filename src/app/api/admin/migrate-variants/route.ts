import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb`;
    return NextResponse.json({ ok: true, message: 'variants column added to products' });
  } catch (err) {
    console.error('migrate-variants error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

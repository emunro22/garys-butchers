import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_items jsonb NOT NULL DEFAULT '[]'::jsonb`;
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_price integer`;
    return NextResponse.json({ ok: true, message: 'deal_items and deal_price columns added' });
  } catch (err) {
    console.error('migrate-deals error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

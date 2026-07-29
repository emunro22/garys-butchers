import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSession } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await sql`DO $$ BEGIN
      CREATE TYPE analytics_event_type AS ENUM ('pageview', 'click');
    EXCEPTION WHEN duplicate_object THEN null; END $$`;
    await sql`CREATE TABLE IF NOT EXISTS analytics_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type analytics_event_type NOT NULL,
      path varchar(300) NOT NULL,
      label varchar(200),
      session_id varchar(40) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (type)`;
    await sql`CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS analytics_events_path_idx ON analytics_events (path)`;
    return NextResponse.json({ ok: true, message: 'analytics_events table ready' });
  } catch (err) {
    console.error('migrate-analytics error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

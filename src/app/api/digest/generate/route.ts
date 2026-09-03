import { NextResponse } from 'next/server';
import { getDefaultHousehold, regenerateDigest, track } from '@/lib/store';

// Simulates the 02:00 nightly Inngest run on demand (useful for the demo).
export async function POST() {
  const hh = getDefaultHousehold();
  const digest = regenerateDigest(hh.id);
  track('nightly_run_simulated', hh.id, { items: digest?.items.length ?? 0 });
  return NextResponse.json({ ok: true, digest });
}

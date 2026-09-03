import { NextResponse } from 'next/server';
import { getDefaultHousehold, track } from '@/lib/store';
import { SESSION_COOKIE, COOKIE_OPTS } from '@/lib/auth';

// "Try the demo" — bind the session to the seeded demo household.
export async function POST() {
  const hh = getDefaultHousehold();
  track('demo_started', hh.id, {});
  const res = NextResponse.json({ ok: true, household: { id: hh.id, ownerName: hh.ownerName } });
  res.cookies.set(SESSION_COOKIE, hh.id, COOKIE_OPTS);
  return res;
}

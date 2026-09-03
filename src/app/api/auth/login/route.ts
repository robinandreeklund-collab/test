import { NextResponse } from 'next/server';
import { findHouseholdByEmail, track } from '@/lib/store';
import { verifyPassword, SESSION_COOKIE, COOKIE_OPTS } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');

  const hh = findHouseholdByEmail(email);
  // Same message for unknown email vs. wrong password — don't leak which.
  if (!hh || !verifyPassword(password, hh.passwordHash)) {
    return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 });
  }

  track('login', hh.id, {});
  const res = NextResponse.json({ ok: true, household: { id: hh.id, ownerName: hh.ownerName, email: hh.email } });
  res.cookies.set(SESSION_COOKIE, hh.id, COOKIE_OPTS);
  return res;
}

import { NextResponse } from 'next/server';
import { createHousehold, findHouseholdByEmail, track } from '@/lib/store';
import { hashPassword, SESSION_COOKIE, COOKIE_OPTS } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ownerName = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');

  if (!ownerName) return NextResponse.json({ error: 'Enter your first name.' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  if (findHouseholdByEmail(email)) {
    return NextResponse.json({ error: 'An account with that email already exists. Try logging in.' }, { status: 409 });
  }

  const hh = createHousehold({ ownerName, email, passwordHash: hashPassword(password) });
  track('signup', hh.id, {});

  const res = NextResponse.json({ ok: true, household: { id: hh.id, ownerName: hh.ownerName, email: hh.email } });
  res.cookies.set(SESSION_COOKIE, hh.id, COOKIE_OPTS);
  return res;
}

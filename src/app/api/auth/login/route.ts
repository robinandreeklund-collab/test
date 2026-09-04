import { NextResponse } from 'next/server';
import { findMemberByEmail, track } from '@/lib/store';
import { verifyPassword, SESSION_COOKIE, COOKIE_OPTS } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');

  const member = findMemberByEmail(email);
  // Same message for unknown email vs. wrong password — don't leak which.
  if (!member || !verifyPassword(password, member.passwordHash)) {
    return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 });
  }

  track('login', member.householdId, { role: member.role });
  const res = NextResponse.json({ ok: true, member: { name: member.name, role: member.role } });
  res.cookies.set(SESSION_COOKIE, member.id, COOKIE_OPTS);
  return res;
}

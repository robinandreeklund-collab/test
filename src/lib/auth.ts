import { cookies } from 'next/headers';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { getHouseholdById, getDefaultHousehold } from './store';
import type { Household } from './types';

export const SESSION_COOKIE = 'gigi_session';

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === 'production',
};

// Password hashing. scrypt with a per-user salt — real enough for the test
// build; production swaps this for Supabase Auth (see docs/DECISIONS.md).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// Resolve the household for the current request from its session cookie.
// Falls back to the seeded demo household so the /app demo links keep working
// even without logging in.
export function resolveHousehold(): Household {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (id) {
    const hh = getHouseholdById(id);
    if (hh) return hh;
  }
  return getDefaultHousehold();
}

// Is there a real (non-fallback) logged-in session?
export function currentSessionHouseholdId(): string | null {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (id && getHouseholdById(id)) return id;
  return null;
}

import { NextResponse } from 'next/server';
import { updateHousehold, track } from '@/lib/store';
import { resolveHousehold } from '@/lib/auth';
import type { Currency, Market } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ household: resolveHousehold() });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const current = resolveHousehold();

  const patch: Record<string, unknown> = {};
  for (const key of [
    'ownerName',
    'adults',
    'children',
    'postcode',
    'timezone',
    'digestTime',
    'digestPaused',
    'connectionStatus',
  ] as const) {
    if (key in body) patch[key] = body[key];
  }

  // Market drives currency + timezone default (single-market beta, see docs).
  if (body.market === 'uk' || body.market === 'se') {
    const market = body.market as Market;
    patch.market = market;
    patch.currency = (market === 'se' ? 'SEK' : 'GBP') as Currency;
    if (!('timezone' in body)) {
      patch.timezone = market === 'se' ? 'Europe/Stockholm' : 'Europe/London';
    }
  }

  const updated = updateHousehold(current.id, patch);
  track('household_updated', current.id, { fields: Object.keys(patch) });
  return NextResponse.json({ household: updated });
}

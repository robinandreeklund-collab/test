import { NextResponse } from 'next/server';
import { getDefaultHousehold, getTodayDigest, markDigestOpened, regenerateDigest, track } from '@/lib/store';

export async function GET(req: Request) {
  const hh = getDefaultHousehold();
  let digest = getTodayDigest(hh.id);
  if (!digest) digest = regenerateDigest(hh.id);

  const url = new URL(req.url);
  if (url.searchParams.get('open') === '1' && digest && !digest.openedAt) {
    markDigestOpened(hh.id);
    track('digest_opened', hh.id, { date: digest.date });
  }

  return NextResponse.json({ digest, household: hh });
}

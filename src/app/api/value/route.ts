import { NextResponse } from 'next/server';
import { valueSummary } from '@/lib/store';
import { resolveHousehold } from '@/lib/auth';

// Always reflect live store state, never a build-time snapshot.
export const dynamic = 'force-dynamic';

// Value tracker — running "GiGi has saved you X and handled Y tasks".
export async function GET() {
  const hh = resolveHousehold();
  return NextResponse.json(valueSummary(hh.id));
}

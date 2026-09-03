import { NextResponse } from 'next/server';
import { getDefaultHousehold, valueSummary } from '@/lib/store';

// Always reflect live store state, never a build-time snapshot.
export const dynamic = 'force-dynamic';

// Value tracker — running "GiGi has saved you X and handled Y tasks".
export async function GET() {
  const hh = getDefaultHousehold();
  return NextResponse.json(valueSummary(hh.id));
}

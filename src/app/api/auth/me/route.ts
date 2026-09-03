import { NextResponse } from 'next/server';
import { resolveHousehold, currentSessionHouseholdId } from '@/lib/auth';
import { getDefaultHousehold } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hh = resolveHousehold();
  const sessionId = currentSessionHouseholdId();
  return NextResponse.json({
    loggedIn: sessionId !== null,
    isDemo: hh.id === getDefaultHousehold().id,
    household: { id: hh.id, ownerName: hh.ownerName, email: hh.email },
  });
}

import { NextResponse } from 'next/server';
import { resolveMember, resolveHousehold, currentMember, capabilitiesFor } from '@/lib/auth';
import { getDefaultHousehold } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const member = resolveMember();
  const hh = resolveHousehold();
  const sessionMember = currentMember();
  return NextResponse.json({
    loggedIn: sessionMember !== null,
    isDemo: hh.id === getDefaultHousehold().id,
    household: { id: hh.id, ownerName: hh.ownerName, email: hh.email },
    member: { name: member.name, role: member.role, email: member.email },
    capabilities: capabilitiesFor(member.role),
  });
}

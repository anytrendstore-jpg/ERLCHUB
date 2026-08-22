import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/staffServer';
import { getERLCStatus, getERLCPlayers, isERLCConfigured } from '@/lib/erlcServer';

export const dynamic = 'force-dynamic';

/** Estado en vivo del servidor de Roblox (ER:LC). Cualquier staff puede verlo. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  if (!isERLCConfigured()) {
    return NextResponse.json({ success: true, configured: false });
  }

  const statusResult = await getERLCStatus();
  if (!statusResult.ok) {
    return NextResponse.json({ success: true, configured: true, online: false, error: statusResult.error });
  }

  const playersResult = await getERLCPlayers();

  return NextResponse.json({
    success: true,
    configured: true,
    online: true,
    serverName: statusResult.data.Name,
    currentPlayers: statusResult.data.CurrentPlayers,
    maxPlayers: statusResult.data.MaxPlayers,
    players: playersResult.ok ? playersResult.data : [],
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { radioPresenceCollection, radioMessagesCollection, currentRadioUser, RADIO_ONLINE_WINDOW_MS } from '@/lib/radioServer';
import { mdtOfficersCollection } from '@/lib/mdtServer';
import { fdFirefightersCollection } from '@/lib/fdServer';
import { RADIO_CHANNELS } from '@/lib/radioChannels';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = currentRadioUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const channelId = request.nextUrl.searchParams.get('channelId');
    const since = new Date(Date.now() - RADIO_ONLINE_WINDOW_MS);

    // Marca implícitamente al usuario como "presente" en su canal actual mientras el cliente sigue haciendo poll.
    const presenceCol = await radioPresenceCollection();
    if (channelId) {
      await presenceCol.updateOne(
        { discordId: user.id },
        { $set: { discordId: user.id, username: user.username, channelId, lastSeen: new Date() } },
        { upsert: true }
      );
    }

    const online = await presenceCol.find({ lastSeen: { $gte: since }, channelId: { $ne: null } }).toArray();

    // Perfil real (placa/unidad) de cada conectado — se busca en mdt_officers y fd_firefighters,
    // nunca inventado: si la persona no está en ninguna de las dos, queda como civil sin placa.
    const discordIds = online.map((p) => p.discordId);
    const [officers, firefighters] = discordIds.length > 0
      ? await Promise.all([
          mdtOfficersCollection().then((col) => col.find({ discordId: { $in: discordIds } }).toArray()),
          fdFirefightersCollection().then((col) => col.find({ discordId: { $in: discordIds } }).toArray()),
        ])
      : [[], []];
    const profileByDiscordId = new Map<string, { badge?: string; unit?: string; faction?: 'LSPD' | 'LSFD' }>();
    for (const o of officers) profileByDiscordId.set(o.discordId, { badge: o.badgeNumber, unit: o.currentUnit, faction: 'LSPD' });
    for (const f of firefighters) profileByDiscordId.set(f.discordId, { badge: f.badgeNumber, unit: f.callsign || f.unit, faction: 'LSFD' });

    const usersByChannel: Record<string, { discordId: string; username: string; voiceEnabled: boolean; badge?: string; unit?: string; faction?: 'LSPD' | 'LSFD' }[]> = {};
    for (const p of online) {
      if (!p.channelId) continue;
      const profile = profileByDiscordId.get(p.discordId);
      const entry = { discordId: p.discordId, username: p.username, voiceEnabled: Boolean(p.voiceEnabled), ...profile };
      (usersByChannel[p.channelId] ||= []).push(entry);
    }

    const channels = RADIO_CHANNELS.map((c) => ({ ...c, connected: (usersByChannel[c.id] || []).length, users: usersByChannel[c.id] || [] }));

    let messages: any[] = [];
    if (channelId) {
      const msgCol = await radioMessagesCollection();
      const docs = await msgCol.find({ channelId }).sort({ createdAt: -1 }).limit(50).toArray();
      messages = docs.reverse().map(({ _id, ...m }: any) => m);
    }

    return NextResponse.json({ success: true, channels, messages, usersInChannel: usersByChannel[channelId || ''] || [] });
  } catch (error) {
    console.error('Error leyendo estado de radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

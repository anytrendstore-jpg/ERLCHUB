import { NextRequest, NextResponse } from 'next/server';
import { radioPresenceCollection, radioMessagesCollection, currentRadioUser, RADIO_ONLINE_WINDOW_MS } from '@/lib/radioServer';
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
    const countByChannel: Record<string, number> = {};
    for (const p of online) {
      if (!p.channelId) continue;
      countByChannel[p.channelId] = (countByChannel[p.channelId] || 0) + 1;
    }

    const channels = RADIO_CHANNELS.map((c) => ({ ...c, connected: countByChannel[c.id] || 0 }));

    let messages: any[] = [];
    let usersInChannel: { discordId: string; username: string }[] = [];
    if (channelId) {
      const msgCol = await radioMessagesCollection();
      const docs = await msgCol.find({ channelId }).sort({ createdAt: -1 }).limit(50).toArray();
      messages = docs.reverse().map(({ _id, ...m }: any) => m);
      usersInChannel = online
        .filter((p) => p.channelId === channelId)
        .map((p) => ({ discordId: p.discordId, username: p.username }));
    }

    return NextResponse.json({ success: true, channels, messages, usersInChannel });
  } catch (error) {
    console.error('Error leyendo estado de radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

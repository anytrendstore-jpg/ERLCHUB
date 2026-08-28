import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { radioPresenceCollection, radioVoiceSignalsCollection, currentRadioUser } from '@/lib/radioServer';

export const dynamic = 'force-dynamic';

/** Prende/apaga el micrófono en el canal actual. Al apagar, avisa "leave" a todos los peers para que cierren la conexión de su lado. */
export async function POST(request: NextRequest) {
  const user = currentRadioUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { voiceEnabled } = await request.json();
    const presenceCol = await radioPresenceCollection();
    const me = await presenceCol.findOne({ discordId: user.id });
    if (!me || !me.channelId) {
      return NextResponse.json({ success: false, error: 'Tenés que estar sintonizado en un canal' }, { status: 400 });
    }

    await presenceCol.updateOne({ discordId: user.id }, { $set: { voiceEnabled: Boolean(voiceEnabled), lastSeen: new Date() } });

    if (!voiceEnabled) {
      const since = new Date(Date.now() - 25000);
      const peers = await presenceCol.find({ channelId: me.channelId, voiceEnabled: true, lastSeen: { $gte: since }, discordId: { $ne: user.id } }).toArray();
      if (peers.length > 0) {
        const signalsCol = await radioVoiceSignalsCollection();
        await signalsCol.insertMany(peers.map((p) => ({
          id: crypto.randomUUID(), channelId: me.channelId!, fromId: user.id, fromUsername: user.username,
          toId: p.discordId, type: 'leave' as const, payload: null, createdAt: new Date(),
        })));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cambiando estado de voz de radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

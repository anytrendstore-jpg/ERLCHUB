import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { radioMessagesCollection, radioPresenceCollection, currentRadioUser } from '@/lib/radioServer';
import { radioChannelById } from '@/lib/radioChannels';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = currentRadioUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { channelId, text } = await request.json();
    const trimmed = String(text || '').trim().slice(0, 200);
    if (!radioChannelById(channelId) || !trimmed) {
      return NextResponse.json({ success: false, error: 'Mensaje o canal inválido' }, { status: 400 });
    }

    const presenceCol = await radioPresenceCollection();
    const presence = await presenceCol.findOne({ discordId: user.id });
    if (!presence || presence.channelId !== channelId) {
      return NextResponse.json({ success: false, error: 'Debes estar sintonizado en el canal para transmitir' }, { status: 403 });
    }

    const col = await radioMessagesCollection();
    const doc = {
      id: crypto.randomUUID(),
      channelId,
      discordId: user.id,
      username: user.username,
      text: trimmed,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, message: doc });
  } catch (error) {
    console.error('Error enviando mensaje de radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar' }, { status: 500 });
  }
}

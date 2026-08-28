import { NextRequest, NextResponse } from 'next/server';
import { radioPresenceCollection, currentRadioUser } from '@/lib/radioServer';
import { radioChannelById } from '@/lib/radioChannels';

export const dynamic = 'force-dynamic';

/** channelId: string para sintonizar, null para salir de todos los canales. */
export async function POST(request: NextRequest) {
  const user = currentRadioUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { channelId } = await request.json();
    if (channelId !== null && !radioChannelById(channelId)) {
      return NextResponse.json({ success: false, error: 'Canal no válido' }, { status: 400 });
    }

    const col = await radioPresenceCollection();
    // Cambiar (o salir) de canal siempre apaga el micrófono: nunca queda "hablando" en un canal que ya no escuchás.
    await col.updateOne(
      { discordId: user.id },
      { $set: { discordId: user.id, username: user.username, channelId, lastSeen: new Date(), voiceEnabled: false } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sintonizando radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

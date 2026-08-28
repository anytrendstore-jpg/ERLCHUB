import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { radioPresenceCollection, radioVoiceSignalsCollection, currentRadioUser } from '@/lib/radioServer';

export const dynamic = 'force-dynamic';

/** Manda una señal WebRTC (oferta/respuesta/candidato ICE) a un peer puntual del mismo canal. Nunca transporta audio, solo negociación. */
export async function POST(request: NextRequest) {
  const user = currentRadioUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { toId, type, payload } = await request.json();
    if (!toId || !['offer', 'answer', 'ice-candidate'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Señal inválida' }, { status: 400 });
    }

    const presenceCol = await radioPresenceCollection();
    const me = await presenceCol.findOne({ discordId: user.id });
    if (!me?.channelId) return NextResponse.json({ success: false, error: 'Tenés que estar sintonizado en un canal' }, { status: 403 });

    const signalsCol = await radioVoiceSignalsCollection();
    await signalsCol.insertOne({
      id: crypto.randomUUID(), channelId: me.channelId, fromId: user.id, fromUsername: user.username,
      toId, type, payload, createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error mandando señal de voz de radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar' }, { status: 500 });
  }
}

/** Poll de consumo único — devuelve las señales dirigidas a mí y las borra en el mismo pedido. */
export async function GET() {
  const user = currentRadioUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const signalsCol = await radioVoiceSignalsCollection();
    const docs = await signalsCol.find({ toId: user.id }).sort({ createdAt: 1 }).toArray();
    if (docs.length > 0) {
      await signalsCol.deleteMany({ id: { $in: docs.map((d) => d.id) } });
    }
    return NextResponse.json({ success: true, signals: docs.map(({ _id, ...s }: any) => s) });
  } catch (error) {
    console.error('Error leyendo señales de voz de radio:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

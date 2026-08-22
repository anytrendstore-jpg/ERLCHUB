import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtMessagesCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

/** Devuelve la bandeja de entrada y enviados del oficial (mensajes internos entre unidades). */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtMessagesCollection();
    const docs = await col.find({ $or: [{ to: user.id }, { from: user.id }] }).sort({ sentAt: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, messages: docs.map(({ _id, ...m }: any) => m) });
  } catch (error) {
    console.error('Error listando mensajes del MDT:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtMessagesCollection();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      isRead: false,
      sentAt: new Date(),
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, message: doc });
  } catch (error) {
    console.error('Error enviando mensaje del MDT:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtMessagesCollection();
    await col.updateOne({ id }, { $set: { isRead: true, readAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marcando mensaje como leído:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

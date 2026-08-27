import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdMessagesCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

/** Bandeja de entrada y enviados del bombero — completamente separada de mdt_messages. */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const col = await fdMessagesCollection();
    const docs = await col.find({ $or: [{ to: user.id }, { from: user.id }] }).sort({ sentAt: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, messages: docs.map(({ _id, ...m }: any) => m) });
  } catch (error) {
    console.error('Error listando mensajes de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const body = await request.json();
    const col = await fdMessagesCollection();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      isRead: false,
      sentAt: new Date(),
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'send_message', description: `Mensaje enviado a ${doc.toName || doc.to}` });
    return NextResponse.json({ success: true, message: doc });
  } catch (error) {
    console.error('Error enviando mensaje de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdMessagesCollection();
    await col.updateOne({ id }, { $set: { isRead: true, readAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marcando mensaje como leído:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

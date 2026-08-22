import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, careerConnectionsCollection, sendConnectionRequest, respondConnectionRequest, getConnectionIds } from '@/lib/hubCareerServer';
import { resolvePlayerIdentity } from '@/lib/whitelistServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [connectionIds, col] = await Promise.all([getConnectionIds(me.id), careerConnectionsCollection()]);
    const pending = await col.find({ toId: me.id, status: 'pending' }).sort({ createdAt: -1 }).toArray();

    const connections = await Promise.all(connectionIds.map(async (id) => {
      const identity = await resolvePlayerIdentity(id, { username: id });
      return { id, name: identity.displayName, avatar: identity.avatar };
    }));
    const invitations = await Promise.all(pending.map(async (p) => {
      const identity = await resolvePlayerIdentity(p.fromId, { username: p.fromId });
      return { connectionId: p.id, fromId: p.fromId, name: identity.displayName, avatar: identity.avatar, message: p.message, createdAt: p.createdAt };
    }));

    return NextResponse.json({ success: true, connections, invitations });
  } catch (error) {
    console.error('Error leyendo conexiones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { toId, message } = await request.json();
    if (!toId) return NextResponse.json({ success: false, error: 'Falta el destinatario' }, { status: 400 });
    const result = await sendConnectionRequest(me.id, toId, message);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enviando invitación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar' }, { status: 500 });
  }
}

/** action: 'accept' | 'decline' */
export async function PATCH(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { connectionId, action } = await request.json();
    if (!connectionId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }
    const result = await respondConnectionRequest(me.id, connectionId, action === 'accept');
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error respondiendo invitación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo responder' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const otherId = request.nextUrl.searchParams.get('userId');
    if (!otherId) return NextResponse.json({ success: false, error: 'Falta el usuario' }, { status: 400 });
    const col = await careerConnectionsCollection();
    await col.deleteOne({ $or: [{ fromId: me.id, toId: otherId }, { fromId: otherId, toId: me.id }], status: 'accepted' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando conexión:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { chatMessagesCollection, chatConversationsCollection, currentChatUser } from '@/lib/chatServer';

export const dynamic = 'force-dynamic';

/** Busca texto dentro de una conversación (no en contactos, eso es /api/chat/search). */
export async function GET(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const conversationId = request.nextUrl.searchParams.get('conversationId');
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (!conversationId) return NextResponse.json({ success: false, error: 'Falta conversationId' }, { status: 400 });
    if (!q) return NextResponse.json({ success: true, messages: [] });

    const convCol = await chatConversationsCollection();
    const conv = await convCol.findOne({ id: conversationId });
    if (!conv || !conv.participants.includes(me.id)) {
      return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
    }

    const msgCol = await chatMessagesCollection();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const docs = await msgCol
      .find({
        conversationId,
        deletedFor: { $ne: me.id },
        deletedForEveryone: { $ne: true },
        text: { $regex: escaped, $options: 'i' },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, messages: docs.map(({ _id, ...m }: any) => m) });
  } catch (error) {
    console.error('Error buscando mensajes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

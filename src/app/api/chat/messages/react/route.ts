import { NextRequest, NextResponse } from 'next/server';
import { chatMessagesCollection, currentChatUser } from '@/lib/chatServer';

export const dynamic = 'force-dynamic';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/** Alterna una reacción emoji del usuario actual sobre un mensaje. */
export async function POST(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { messageId, emoji } = await request.json();
    if (!messageId || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const msgCol = await chatMessagesCollection();
    const msg = await msgCol.findOne({ id: messageId });
    if (!msg) return NextResponse.json({ success: false, error: 'Mensaje no encontrado' }, { status: 404 });

    const reactions: Record<string, string[]> = { ...(msg.reactions || {}) };
    const already = (reactions[emoji] || []).includes(me.id);

    // Quita cualquier reacción previa del usuario en otros emojis (una reacción por persona, estilo WhatsApp).
    for (const key of Object.keys(reactions)) {
      reactions[key] = (reactions[key] || []).filter((id) => id !== me.id);
      if (reactions[key].length === 0) delete reactions[key];
    }

    if (!already) {
      reactions[emoji] = [...(reactions[emoji] || []), me.id];
    }

    await msgCol.updateOne({ id: messageId }, { $set: { reactions } });

    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    console.error('Error reaccionando al mensaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo reaccionar' }, { status: 500 });
  }
}

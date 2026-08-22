import { NextRequest, NextResponse } from 'next/server';
import { chatPresenceCollection, currentChatUser, CHAT_TYPING_WINDOW_MS } from '@/lib/chatServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { conversationId } = await request.json();
    const col = await chatPresenceCollection();
    await col.updateOne(
      { discordId: me.id },
      {
        $set: {
          discordId: me.id,
          lastSeen: new Date(),
          typingIn: conversationId || undefined,
          typingUntil: conversationId ? new Date(Date.now() + CHAT_TYPING_WINDOW_MS) : undefined,
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando escritura:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

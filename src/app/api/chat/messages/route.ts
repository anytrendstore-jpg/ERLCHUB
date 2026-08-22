import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  chatMessagesCollection,
  chatConversationsCollection,
  chatPresenceCollection,
  currentChatUser,
  touchChatPresence,
  CHAT_TYPING_WINDOW_MS,
} from '@/lib/chatServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const conversationId = request.nextUrl.searchParams.get('conversationId');
    if (!conversationId) return NextResponse.json({ success: false, error: 'Falta conversationId' }, { status: 400 });

    const convCol = await chatConversationsCollection();
    const conv = await convCol.findOne({ id: conversationId });
    if (!conv || !conv.participants.includes(me.id)) {
      return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
    }

    await touchChatPresence(me.id);

    const msgCol = await chatMessagesCollection();
    await msgCol.updateMany(
      { conversationId, senderId: { $ne: me.id }, readBy: { $ne: me.id } },
      { $addToSet: { readBy: me.id } }
    );

    const docs = await msgCol
      .find({ conversationId, deletedFor: { $ne: me.id } })
      .sort({ createdAt: 1 })
      .limit(200)
      .toArray();

    // ¿El otro participante está escribiendo ahora mismo?
    let othersTyping: string[] = [];
    const otherIds = conv.participants.filter((id) => id !== me.id);
    if (otherIds.length > 0) {
      const presenceCol = await chatPresenceCollection();
      const typing = await presenceCol.find({
        discordId: { $in: otherIds },
        typingIn: conversationId,
        typingUntil: { $gte: new Date() },
      }).toArray();
      othersTyping = typing.map((t) => t.discordId);
    }

    return NextResponse.json({
      success: true,
      messages: docs.map(({ _id, ...m }: any) => m),
      othersTyping,
    });
  } catch (error) {
    console.error('Error listando mensajes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { conversationId, text, replyToId } = await request.json();
    const trimmed = String(text || '').trim().slice(0, 1000);
    if (!conversationId || !trimmed) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const convCol = await chatConversationsCollection();
    const conv = await convCol.findOne({ id: conversationId });
    if (!conv || !conv.participants.includes(me.id)) {
      return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
    }

    const msgCol = await chatMessagesCollection();

    let replyTo: { messageId: string; senderDisplayName: string; text: string } | undefined;
    if (replyToId) {
      const original = await msgCol.findOne({ id: replyToId, conversationId });
      if (original && !original.deletedForEveryone) {
        replyTo = { messageId: original.id, senderDisplayName: original.senderDisplayName, text: original.text.slice(0, 200) };
      }
    }

    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: me.id,
      senderUsername: me.username,
      senderDisplayName: me.displayName,
      senderAvatar: me.avatar,
      text: trimmed,
      readBy: [me.id],
      deletedFor: [],
      deletedForEveryone: false,
      reactions: {},
      ...(replyTo ? { replyTo } : {}),
      createdAt: now,
    };

    await msgCol.insertOne(doc);

    await convCol.updateOne(
      { id: conversationId },
      {
        $set: { updatedAt: now, lastMessage: { text: trimmed, senderId: me.id, createdAt: now } },
        $pull: { deletedFor: { $in: conv.participants } },
      }
    );

    const recipients = conv.participants.filter((id) => id !== me.id && !conv.mutedBy?.includes(id));
    await Promise.all(recipients.map((id) => notifyUser(id, {
      title: conv.isGroup ? (conv.name || 'Nuevo mensaje') : me.displayName,
      message: conv.isGroup ? `${me.displayName}: ${trimmed}` : trimmed,
      type: 'info',
      appId: 'hubchat',
    })));

    return NextResponse.json({ success: true, message: doc });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar' }, { status: 500 });
  }
}

/** Edita el texto de un mensaje propio (marca editedAt). */
export async function PATCH(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { messageId, text } = await request.json();
    const trimmed = String(text || '').trim().slice(0, 1000);
    if (!messageId || !trimmed) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const msgCol = await chatMessagesCollection();
    const msg = await msgCol.findOne({ id: messageId });
    if (!msg) return NextResponse.json({ success: false, error: 'Mensaje no encontrado' }, { status: 404 });
    if (msg.senderId !== me.id) {
      return NextResponse.json({ success: false, error: 'Solo puedes editar tus propios mensajes' }, { status: 403 });
    }
    if (msg.deletedForEveryone) {
      return NextResponse.json({ success: false, error: 'No se puede editar un mensaje eliminado' }, { status: 400 });
    }

    const editedAt = new Date();
    await msgCol.updateOne({ id: messageId }, { $set: { text: trimmed, editedAt } });

    const convCol = await chatConversationsCollection();
    const conv = await convCol.findOne({ id: msg.conversationId });
    if (conv?.lastMessage?.senderId === msg.senderId && conv.lastMessage?.createdAt && msg.createdAt &&
        new Date(conv.lastMessage.createdAt).getTime() === new Date(msg.createdAt).getTime()) {
      await convCol.updateOne({ id: msg.conversationId }, { $set: { 'lastMessage.text': trimmed } });
    }

    return NextResponse.json({ success: true, editedAt });
  } catch (error) {
    console.error('Error editando mensaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo editar' }, { status: 500 });
  }
}

/** Elimina un mensaje: mode 'me' (oculto solo para mí) o 'everyone' (solo el autor, dentro de la ventana permitida). */
export async function DELETE(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { messageId, mode } = await request.json();
    if (!messageId) return NextResponse.json({ success: false, error: 'Falta messageId' }, { status: 400 });

    const msgCol = await chatMessagesCollection();
    const msg = await msgCol.findOne({ id: messageId });
    if (!msg) return NextResponse.json({ success: false, error: 'Mensaje no encontrado' }, { status: 404 });

    if (mode === 'everyone') {
      if (msg.senderId !== me.id) {
        return NextResponse.json({ success: false, error: 'Solo el autor puede eliminar para todos' }, { status: 403 });
      }
      await msgCol.updateOne({ id: messageId }, { $set: { deletedForEveryone: true, text: '' } });
    } else {
      await msgCol.updateOne({ id: messageId }, { $addToSet: { deletedFor: me.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando mensaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

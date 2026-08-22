import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  chatConversationsCollection,
  chatMessagesCollection,
  chatPresenceCollection,
  currentChatUser,
  touchChatPresence,
  CHAT_ONLINE_WINDOW_MS,
} from '@/lib/chatServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await touchChatPresence(me.id);

    const archivedOnly = request.nextUrl.searchParams.get('archived') === '1';
    const col = await chatConversationsCollection();
    const docs = await col
      .find({
        participants: me.id,
        deletedFor: { $ne: me.id },
        archivedBy: archivedOnly ? me.id : { $ne: me.id },
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const otherIds = Array.from(new Set(docs.flatMap((d) => d.participants).filter((id) => id !== me.id)));
    const profilesCol = await socialProfilesCollection();
    const profiles = await profilesCol.find({ discordId: { $in: otherIds } }).toArray();
    const profileById = new Map(profiles.map((p) => [p.discordId, p]));

    const presenceCol = await chatPresenceCollection();
    const since = new Date(Date.now() - CHAT_ONLINE_WINDOW_MS);
    const online = await presenceCol.find({ discordId: { $in: otherIds }, lastSeen: { $gte: since } }).toArray();
    const onlineSet = new Set(online.map((p) => p.discordId));

    const msgCol = await chatMessagesCollection();

    const conversations = await Promise.all(docs.map(async (conv) => {
      const { _id, ...clean } = conv as any;
      const unreadCount = await msgCol.countDocuments({
        conversationId: conv.id,
        senderId: { $ne: me.id },
        readBy: { $ne: me.id },
      });

      if (conv.isGroup) {
        return { ...clean, unreadCount, displayName: conv.name || 'Grupo', displayAvatar: conv.avatar, isOnline: false };
      }

      const otherId = conv.participants.find((id) => id !== me.id);
      const otherProfile = otherId ? profileById.get(otherId) : undefined;
      return {
        ...clean,
        unreadCount,
        displayName: otherProfile?.displayName || otherProfile?.username || 'Usuario',
        otherUsername: otherProfile?.username,
        displayAvatar: otherProfile?.avatarUrl || otherProfile?.avatar,
        otherId,
        isOnline: otherId ? onlineSet.has(otherId) : false,
      };
    }));

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Error listando conversaciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crea una conversación directa (dedupe si ya existe) o un grupo nuevo. */
export async function POST(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { participantIds, isGroup, name } = await request.json();
    const ids: string[] = Array.isArray(participantIds) ? participantIds.filter((id) => id && id !== me.id) : [];
    if (ids.length === 0) return NextResponse.json({ success: false, error: 'Selecciona al menos un participante' }, { status: 400 });

    const col = await chatConversationsCollection();

    if (!isGroup && ids.length === 1) {
      const existing = await col.findOne({ isGroup: false, participants: { $all: [me.id, ids[0]], $size: 2 } });
      if (existing) {
        if (existing.deletedFor.includes(me.id)) {
          await col.updateOne({ id: existing.id }, { $pull: { deletedFor: me.id } });
        }
        const { _id, ...clean } = existing as any;
        return NextResponse.json({ success: true, conversation: clean });
      }
    }

    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      isGroup: Boolean(isGroup),
      participants: [me.id, ...ids],
      deletedFor: [],
      pinnedBy: [],
      archivedBy: [],
      mutedBy: [],
      name: isGroup ? (String(name || 'Nuevo grupo').trim().slice(0, 60)) : undefined,
      createdBy: me.id,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, conversation: doc });
  } catch (error) {
    console.error('Error creando conversación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la conversación' }, { status: 500 });
  }
}

/** action: 'rename' | 'setAvatar' | 'addMember' | 'removeMember' */
export async function PATCH(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { conversationId, action, name, avatar, memberId } = await request.json();
    const col = await chatConversationsCollection();
    const conv = await col.findOne({ id: conversationId });
    if (!conv || !conv.participants.includes(me.id)) {
      return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
    }
    if (action === 'togglePin' || action === 'toggleArchive' || action === 'toggleMute') {
      const field = action === 'togglePin' ? 'pinnedBy' : action === 'toggleArchive' ? 'archivedBy' : 'mutedBy';
      const already = (conv as any)[field]?.includes(me.id);
      await col.updateOne({ id: conversationId }, already ? { $pull: { [field]: me.id } } : { $addToSet: { [field]: me.id } });
      return NextResponse.json({ success: true, active: !already });
    }

    if (!conv.isGroup) return NextResponse.json({ success: false, error: 'Solo aplica a grupos' }, { status: 400 });

    const isAdmin = conv.createdBy === me.id;

    if (action === 'addMember' && memberId) {
      await col.updateOne({ id: conversationId }, { $addToSet: { participants: memberId }, $set: { updatedAt: new Date() } });
    } else if (action === 'removeMember' && memberId) {
      if (!isAdmin && memberId !== me.id) {
        return NextResponse.json({ success: false, error: 'Solo el administrador puede expulsar miembros' }, { status: 403 });
      }
      await col.updateOne({ id: conversationId }, { $pull: { participants: memberId }, $set: { updatedAt: new Date() } });
    } else if (action === 'rename' && typeof name === 'string') {
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Solo el administrador puede renombrar el grupo' }, { status: 403 });
      await col.updateOne({ id: conversationId }, { $set: { name: name.trim().slice(0, 60), updatedAt: new Date() } });
    } else if (action === 'setAvatar' && typeof avatar === 'string') {
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Solo el administrador puede cambiar la foto' }, { status: 403 });
      await col.updateOne({ id: conversationId }, { $set: { avatar: avatar.trim().slice(0, 1000), updatedAt: new Date() } });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando conversación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

/** Borrado suave: oculta la conversación solo para quien la borra (no borra los mensajes). */
export async function DELETE(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { conversationId } = await request.json();
    const col = await chatConversationsCollection();
    await col.updateOne({ id: conversationId }, { $addToSet: { deletedFor: me.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando conversación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

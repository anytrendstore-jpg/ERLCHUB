import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialPostsCollection, currentSocialUser, touchSocialProfile, isSocialSuspended, resolveMentions } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    if (await isSocialSuspended(user.id)) {
      return NextResponse.json({ success: false, error: 'Tu cuenta de HubSocial está suspendida por staff' }, { status: 403 });
    }

    const { postId, text, parentCommentId } = await request.json();
    const trimmed = String(text || '').trim().slice(0, 300);
    if (!postId || !trimmed) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    // Solo se permite responder a un comentario de primer nivel (hilos de un solo nivel).
    const parent = parentCommentId
      ? (existing.comments || []).find((c) => c.id === parentCommentId && !c.parentCommentId)
      : undefined;

    const comment = {
      id: crypto.randomUUID(),
      discordId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      text: trimmed,
      ...(parent ? { parentCommentId: parent.id } : {}),
      createdAt: new Date(),
    };
    await col.updateOne({ id: postId }, { $push: { comments: comment } });
    await touchSocialProfile(user);

    if (existing.discordId !== user.id) {
      await notifyUser(existing.discordId, {
        title: 'Nuevo comentario',
        message: `${user.displayName} comentó: "${trimmed.slice(0, 80)}"`,
        type: 'info',
        appId: 'hubsocial',
      });
    }
    if (parent && parent.discordId !== user.id && parent.discordId !== existing.discordId) {
      await notifyUser(parent.discordId, {
        title: 'Nueva respuesta',
        message: `${user.displayName} respondió tu comentario: "${trimmed.slice(0, 80)}"`,
        type: 'info',
        appId: 'hubsocial',
      });
    }

    const mentioned = await resolveMentions(trimmed, user.id);
    await Promise.all(mentioned
      .filter((m) => m.discordId !== existing.discordId)
      .map((m) => notifyUser(m.discordId, {
        title: 'Te mencionaron',
        message: `${user.displayName} te mencionó en un comentario`,
        type: 'info',
        appId: 'hubsocial',
      })));

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error comentando:', error);
    return NextResponse.json({ success: false, error: 'No se pudo comentar' }, { status: 500 });
  }
}

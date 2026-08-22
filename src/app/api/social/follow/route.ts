import { NextRequest, NextResponse } from 'next/server';
import { socialFollowsCollection, currentSocialUser } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Toggle: si ya sigue al usuario lo deja de seguir, si no lo empieza a seguir. */
export async function POST(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { targetId } = await request.json();
    if (!targetId || targetId === me.id) {
      return NextResponse.json({ success: false, error: 'Usuario inválido' }, { status: 400 });
    }

    const col = await socialFollowsCollection();
    const existing = await col.findOne({ followerId: me.id, followingId: targetId });

    if (existing) {
      await col.deleteOne({ followerId: me.id, followingId: targetId });
      return NextResponse.json({ success: true, following: false });
    }

    await col.insertOne({ followerId: me.id, followingId: targetId, createdAt: new Date() });
    await notifyUser(targetId, {
      title: 'Nuevo seguidor',
      message: `${me.displayName} (@${me.username}) empezó a seguirte`,
      type: 'info',
      appId: 'hubsocial',
    });
    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error('Error siguiendo usuario:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

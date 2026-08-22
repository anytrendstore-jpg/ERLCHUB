import { NextRequest, NextResponse } from 'next/server';
import { socialPostsCollection, currentSocialUser } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Toggle: si ya dio like lo quita, si no lo agrega. */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const alreadyLiked = existing.likes.includes(user.id);
    await col.updateOne(
      { id: postId },
      alreadyLiked ? { $pull: { likes: user.id } } : { $addToSet: { likes: user.id } }
    );

    if (!alreadyLiked && existing.discordId !== user.id) {
      await notifyUser(existing.discordId, {
        title: 'Nuevo like',
        message: `${user.displayName} le dio like a tu publicación`,
        type: 'info',
        appId: 'hubsocial',
      });
    }

    return NextResponse.json({ success: true, liked: !alreadyLiked });
  } catch (error) {
    console.error('Error dando like:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

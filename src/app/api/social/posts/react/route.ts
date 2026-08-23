import { NextRequest, NextResponse } from 'next/server';
import { socialPostsCollection, currentSocialUser } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';
import type { SocialReactionType } from '@/lib/socialTypes';

export const dynamic = 'force-dynamic';

const VALID_TYPES: SocialReactionType[] = ['like', 'love', 'haha', 'wow', 'sad'];
const REACTION_LABEL: Record<SocialReactionType, string> = {
  like: 'like', love: 'me encanta', haha: 'me divierte', wow: 'me sorprende', sad: 'me entristece',
};

/**
 * Reemplaza el toggle simple de /posts/like con multi-reacción: mismo tipo de nuevo = la
 * quita, tipo distinto = la cambia. /posts/like se deja intacta (nadie la borró) para no
 * romper nada existente, pero el cliente nuevo usa esta ruta.
 */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId, type } = await request.json();
    if (!postId || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const currentReaction = (existing.reactions || []).find((r) => r.discordId === user.id);
    const removing = currentReaction?.type === type;

    await col.updateOne({ id: postId }, { $pull: { reactions: { discordId: user.id } } });
    if (!removing) {
      await col.updateOne({ id: postId }, { $push: { reactions: { discordId: user.id, type } } });
    }

    if (!removing && existing.discordId !== user.id) {
      await notifyUser(existing.discordId, {
        title: 'Nueva reacción',
        message: `A ${user.displayName} le ${REACTION_LABEL[type as SocialReactionType]} tu publicación`,
        type: 'info',
        appId: 'hubsocial',
      });
    }

    return NextResponse.json({ success: true, reaction: removing ? null : type });
  } catch (error) {
    console.error('Error reaccionando:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

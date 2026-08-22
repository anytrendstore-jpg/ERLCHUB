import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { socialPostsCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Lista publicaciones para moderación. q busca por texto/usuario, filter=removed|featured|all. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const filter = request.nextUrl.searchParams.get('filter') || 'all';

    const query: Record<string, unknown> = {};
    if (filter === 'removed') query.removedByStaff = true;
    if (filter === 'featured') query.featured = true;
    if (q) {
      query.$or = [
        { text: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
      ];
    }

    const col = await socialPostsCollection();
    const docs = await col.find(query).sort({ createdAt: -1 }).limit(100).toArray();
    return NextResponse.json({ success: true, posts: docs.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando publicaciones (staff):', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'remove' | 'restore' | 'feature' | 'unfeature' | 'deleteComment' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const { postId, action, reason, commentId } = await request.json();
    if (!postId || !action) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const col = await socialPostsCollection();
    const post = await col.findOne({ id: postId });
    if (!post) return NextResponse.json({ success: false, error: 'Publicación no encontrada' }, { status: 404 });

    const identity = staffIdentity();
    const actorName = identity?.name || 'Staff';

    if (action === 'remove') {
      await col.updateOne({ id: postId }, { $set: { removedByStaff: true, removedReason: String(reason || '').trim().slice(0, 300) } });
      await logStaffAction({
        type: 'social_post_removed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: postId, description: `${actorName} eliminó una publicación de @${post.username}`,
      });
    } else if (action === 'restore') {
      await col.updateOne({ id: postId }, { $set: { removedByStaff: false }, $unset: { removedReason: '' } });
      await logStaffAction({
        type: 'social_post_restored', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: postId, description: `${actorName} restauró una publicación de @${post.username}`,
      });
    } else if (action === 'feature' || action === 'unfeature') {
      await col.updateOne({ id: postId }, { $set: { featured: action === 'feature' } });
      await logStaffAction({
        type: 'social_post_featured', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: postId, description: `${actorName} ${action === 'feature' ? 'destacó' : 'quitó de destacados'} una publicación de @${post.username}`,
      });
    } else if (action === 'deleteComment' && commentId) {
      await col.updateOne({ id: postId }, { $pull: { comments: { id: commentId } } });
      await logStaffAction({
        type: 'social_comment_removed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: postId, description: `${actorName} eliminó un comentario en una publicación de @${post.username}`,
      });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moderando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

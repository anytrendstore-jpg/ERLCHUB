import { NextRequest, NextResponse } from 'next/server';
import { socialPostsCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Toggle: guardar/quitar de favoritos. */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const alreadySaved = existing.savedBy.includes(user.id);
    await col.updateOne(
      { id: postId },
      alreadySaved ? { $pull: { savedBy: user.id } } : { $addToSet: { savedBy: user.id } }
    );

    return NextResponse.json({ success: true, saved: !alreadySaved });
  } catch (error) {
    console.error('Error guardando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

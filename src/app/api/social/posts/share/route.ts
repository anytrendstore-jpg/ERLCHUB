import { NextRequest, NextResponse } from 'next/server';
import { socialPostsCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Registra que el usuario compartió la publicación (contador simple, idempotente por usuario). */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    await col.updateOne({ id: postId }, { $addToSet: { shares: user.id } });
    const fresh = await col.findOne({ id: postId });

    return NextResponse.json({ success: true, shares: fresh?.shares.length || 0 });
  } catch (error) {
    console.error('Error compartiendo publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo compartir' }, { status: 500 });
  }
}

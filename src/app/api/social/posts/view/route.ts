import { NextRequest, NextResponse } from 'next/server';
import { socialPostsCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Registra una vista única por usuario (idempotente). */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await socialPostsCollection();
    await col.updateOne({ id: postId }, { $addToSet: { viewedBy: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando vista:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar' }, { status: 500 });
  }
}

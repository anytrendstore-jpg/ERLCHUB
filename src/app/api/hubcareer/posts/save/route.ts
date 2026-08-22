import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { toggleSavePost, sharePost } from '@/lib/hubCareerFeedServer';

export const dynamic = 'force-dynamic';

/** action: 'save' (toggle guardado) | 'share' (incrementa contador de compartidos) */
export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId, action } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta la publicación' }, { status: 400 });

    if (action === 'share') {
      const result = await sharePost(postId);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    const result = await toggleSavePost(me.id, postId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, saved: result.saved });
  } catch (error) {
    console.error('Error guardando/compartiendo publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

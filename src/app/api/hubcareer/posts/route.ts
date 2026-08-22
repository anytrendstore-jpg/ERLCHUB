import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { createPost } from '@/lib/hubCareerFeedServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const result = await createPost(me, {
      text: body.text || '', imageUrl: body.imageUrl, linkUrl: body.linkUrl,
      visibility: body.visibility || 'public', asCompanyId: body.asCompanyId,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, post: result.post });
  } catch (error) {
    console.error('Error creando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar' }, { status: 500 });
  }
}

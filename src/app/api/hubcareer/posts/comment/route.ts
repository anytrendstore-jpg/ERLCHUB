import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { addComment, careerCommentsCollection } from '@/lib/hubCareerFeedServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const postId = request.nextUrl.searchParams.get('postId');
    if (!postId) return NextResponse.json({ success: false, error: 'Falta la publicación' }, { status: 400 });
    const col = await careerCommentsCollection();
    const docs = await col.find({ postId }).sort({ createdAt: 1 }).toArray();
    return NextResponse.json({ success: true, comments: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error leyendo comentarios:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId, text, parentId } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta la publicación' }, { status: 400 });
    const result = await addComment(me, postId, text || '', parentId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, comment: result.comment });
  } catch (error) {
    console.error('Error comentando:', error);
    return NextResponse.json({ success: false, error: 'No se pudo comentar' }, { status: 500 });
  }
}

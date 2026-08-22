import { NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { getFeed } from '@/lib/hubCareerFeedServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const posts = await getFeed(me.id);
    return NextResponse.json({ success: true, posts: posts.map(({ _id, ...p }: any) => ({ ...p, hasReacted: Object.fromEntries(Object.entries(p.reactions).map(([k, v]: any) => [k, v.includes(me.id)])), hasSaved: p.savedBy.includes(me.id) })) });
  } catch (error) {
    console.error('Error leyendo feed de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

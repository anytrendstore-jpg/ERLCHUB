import { NextRequest, NextResponse } from 'next/server';
import { socialStoriesCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { storyId } = await request.json();
    const col = await socialStoriesCollection();
    await col.updateOne({ id: storyId }, { $addToSet: { viewedBy: me.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando vista de historia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar' }, { status: 500 });
  }
}

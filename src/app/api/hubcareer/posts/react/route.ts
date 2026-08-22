import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { toggleReaction, type ReactionType } from '@/lib/hubCareerFeedServer';

export const dynamic = 'force-dynamic';

const VALID: ReactionType[] = ['like', 'support', 'interesting', 'congrats', 'excellent'];

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId, reaction } = await request.json();
    if (!postId || !VALID.includes(reaction)) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    const result = await toggleReaction(me.id, postId, reaction);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reaccionando:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

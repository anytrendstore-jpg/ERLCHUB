import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, toggleBlockUser } from '@/lib/hubCareerServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ success: false, error: 'Falta el usuario' }, { status: 400 });
    const result = await toggleBlockUser(me.id, userId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, blocked: result.blocked });
  } catch (error) {
    console.error('Error bloqueando usuario:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

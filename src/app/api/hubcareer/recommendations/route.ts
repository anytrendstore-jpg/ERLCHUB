import { NextResponse } from 'next/server';
import { currentCareerUser, getRecommendations } from '@/lib/hubCareerServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const recommendations = await getRecommendations(me.id);
    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    console.error('Error generando recomendaciones de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

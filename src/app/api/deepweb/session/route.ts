import { NextResponse } from 'next/server';
import { currentDeepWebUser } from '@/lib/deepwebServer';
import { getDeepWebState, startDeepWebSession, endDeepWebSession, exposureTier } from '@/lib/deepwebSessionServer';
import { resolveVpsState } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

function serialize(state: Awaited<ReturnType<typeof getDeepWebState>>, vpsActive: boolean) {
  return {
    exposure: Math.round(state.exposure),
    tier: exposureTier(state.exposure),
    sessionActive: state.sessionActive,
    vpsProtected: state.vpsProtected,
    securityLevel: state.securityLevel,
    vpsActive,
  };
}

export async function GET() {
  const me = await currentDeepWebUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [state, vpsSub] = await Promise.all([getDeepWebState(me.id), resolveVpsState(me.id)]);
    return NextResponse.json({ success: true, state: serialize(state, vpsSub?.status === 'active') });
  } catch (error) {
    console.error('Error leyendo estado de Deep Web:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Inicia una sesión real en la Deep Web: sube exposición, evalúa protección VPS y rueda eventos de riesgo server-side. */
export async function POST() {
  const me = await currentDeepWebUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { state, events } = await startDeepWebSession(me.id);
    const vpsSub = await resolveVpsState(me.id);
    return NextResponse.json({ success: true, state: serialize(state, vpsSub?.status === 'active'), events });
  } catch (error) {
    console.error('Error iniciando sesión de Deep Web:', error);
    return NextResponse.json({ success: false, error: 'No se pudo iniciar la sesión' }, { status: 500 });
  }
}

/** Cierra la sesión activa manualmente. */
export async function DELETE() {
  const me = await currentDeepWebUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const state = await endDeepWebSession(me.id);
    const vpsSub = await resolveVpsState(me.id);
    return NextResponse.json({ success: true, state: serialize(state, vpsSub?.status === 'active') });
  } catch (error) {
    console.error('Error cerrando sesión de Deep Web:', error);
    return NextResponse.json({ success: false, error: 'No se pudo cerrar la sesión' }, { status: 500 });
  }
}

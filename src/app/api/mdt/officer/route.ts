import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser, mdtOfficersCollection, ensureOfficerProfile } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

/** Devuelve (creando si hace falta) el perfil de oficial del jugador autenticado. */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const officer = await ensureOfficerProfile(user);
    const { _id, ...clean } = officer as any;
    return NextResponse.json({ success: true, officer: clean });
  } catch (error) {
    console.error('Error obteniendo perfil de oficial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Actualiza campos propios: estado de servicio, unidad, canal de radio, estado operativo. */
export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    for (const key of ['onDuty', 'currentUnit', 'radioChannel', 'status'] as const) {
      if (key in body) allowed[key] = body[key];
    }
    allowed.updatedAt = new Date();

    const col = await mdtOfficersCollection();
    await col.updateOne({ discordId: user.id }, { $set: allowed });
    const fresh = await col.findOne({ discordId: user.id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, officer: clean });
  } catch (error) {
    console.error('Error actualizando perfil de oficial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

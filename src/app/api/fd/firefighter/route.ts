import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser } from '@/lib/mdtServer';
import { ensureFirefighterProfile, fdFirefightersCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Devuelve (creando si hace falta) el perfil de bombero, con el rango real de la facción resuelto en vivo. */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const access = await checkFactionAccess(user.id, 'LSFD');
    if (!access.allowed) return NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 });

    const firefighter = await ensureFirefighterProfile(user);
    const { _id, ...clean } = firefighter as any;
    return NextResponse.json({
      success: true,
      firefighter: { ...clean, rankName: access.rank?.name || 'Sin rango', rankLevel: access.rank?.level ?? 0 },
    });
  } catch (error) {
    console.error('Error obteniendo perfil de bombero:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Actualiza campos propios: estado de servicio, unidad, callsign, estado operativo. */
export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    for (const key of ['onDuty', 'unit', 'callsign', 'status'] as const) {
      if (key in body) allowed[key] = body[key];
    }
    allowed.updatedAt = new Date();

    const col = await fdFirefightersCollection();
    await col.updateOne({ discordId: user.id }, { $set: allowed });
    const fresh = await col.findOne({ discordId: user.id });
    const { _id, ...clean } = fresh as any;

    if ('onDuty' in body) {
      logFDAudit({
        firefighterId: user.id,
        firefighterName: user.displayName,
        action: body.onDuty ? 'login' : 'logout',
        description: body.onDuty ? `${user.displayName} entró en servicio` : `${user.displayName} salió de servicio`,
      });
    }

    return NextResponse.json({ success: true, firefighter: clean });
  } catch (error) {
    console.error('Error actualizando perfil de bombero:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

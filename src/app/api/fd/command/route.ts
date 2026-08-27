import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtCallsCollection } from '@/lib/mdtServer';
import { fdIncidentCommandCollection } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Administración (AdminFactionPanel/faction/route.ts) — no un umbral nuevo. */
const COMMAND_LEVEL = 4;

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user, rankLevel: access.rank?.level ?? 0 };
}

/** GET ?callId=X — estructura de comando de un incidente (null si todavía no se estableció). */
export async function GET(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  const callId = request.nextUrl.searchParams.get('callId');
  if (!callId) return NextResponse.json({ success: false, error: 'Falta el incidente' }, { status: 400 });

  try {
    const col = await fdIncidentCommandCollection();
    const doc = await col.findOne({ callId });
    if (!doc) return NextResponse.json({ success: true, command: null });
    const { _id, ...clean } = doc as any;
    return NextResponse.json({ success: true, command: clean });
  } catch (error) {
    console.error('Error obteniendo comando de incidente:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** PATCH — establece o actualiza una asignación de rol. Solo mando (nivel 4+), y solo sobre incidentes reales de Bomberos. */
export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para asignar comando` }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { callId, role, firefighterId, firefighterName } = body;
    if (!callId || !role) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const callsCol = await mdtCallsCollection();
    const call = await callsCol.findOne({ id: callId });
    if (!call || call.faction !== 'Bomberos') {
      return NextResponse.json({ success: false, error: 'Ese incidente no es de LSFD' }, { status: 403 });
    }

    const col = await fdIncidentCommandCollection();
    const now = new Date();
    const existing = await col.findOne({ callId });

    const assignment = { role, firefighterId: firefighterId || undefined, firefighterName: firefighterName || undefined };

    if (!existing) {
      const doc = {
        id: crypto.randomUUID(),
        callId,
        assignments: [assignment],
        establishedBy: user.id,
        establishedAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc as any);
      return NextResponse.json({ success: true, command: doc });
    }

    const nextAssignments = [
      ...existing.assignments.filter((a) => a.role !== role),
      assignment,
    ];
    await col.updateOne({ callId }, { $set: { assignments: nextAssignments, updatedAt: now } });
    const fresh = await col.findOne({ callId });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, command: clean });
  } catch (error) {
    console.error('Error actualizando comando de incidente:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

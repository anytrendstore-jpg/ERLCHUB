import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdShiftsCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Comando/Academia — programar turnos ajenos es una acción de mando. */
const COMMAND_LEVEL = 4;

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user, rankLevel: access.rank?.level ?? 0 };
}

/** Cualquier miembro ve el cuadro completo de turnos (necesitan saber quién cubre cuándo); solo mando programa. */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdShiftsCollection();
    const docs = await col.find({}).sort({ start: 1 }).toArray();
    return NextResponse.json({ success: true, shifts: docs.map(({ _id, ...s }: any) => s) });
  } catch (error) {
    console.error('Error listando turnos de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para programar turnos` }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.firefighterId || !body.firefighterName || !body.start || !body.end) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }
    const start = new Date(body.start);
    const end = new Date(body.end);
    if (end <= start) return NextResponse.json({ success: false, error: 'El fin del turno debe ser posterior al inicio' }, { status: 400 });

    const col = await fdShiftsCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      firefighterId: body.firefighterId,
      firefighterName: body.firefighterName,
      start,
      end,
      station: body.station ? String(body.station).trim().slice(0, 100) : undefined,
      status: 'Scheduled' as const,
      createdById: user.id,
      createdByName: user.displayName,
      createdAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'schedule_shift', description: `Turno programado: ${doc.firefighterName} — ${start.toLocaleDateString('es-ES')}` });
    return NextResponse.json({ success: true, shift: doc });
  } catch (error) {
    console.error('Error programando turno de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdShiftsCollection();
    const existing = await col.findOne({ id });
    if (!existing) return NextResponse.json({ success: false, error: 'Turno no encontrado' }, { status: 404 });

    // Cualquier miembro puede marcar SU PROPIO turno como Active/Completed/Missed; reprogramar horario/estación es de mando.
    const selfStatusOnly = Object.keys(updates).every((k) => k === 'status');
    if (!(existing.firefighterId === user.id && selfStatusOnly) && rankLevel < COMMAND_LEVEL) {
      return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para editar turnos ajenos` }, { status: 403 });
    }

    await col.updateOne({ id }, { $set: updates });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_shift', description: `Turno actualizado: ${clean.firefighterName || id}` });
    return NextResponse.json({ success: true, shift: clean });
  } catch (error) {
    console.error('Error actualizando turno de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

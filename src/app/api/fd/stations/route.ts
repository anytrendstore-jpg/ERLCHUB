import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdStationsCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Administración — crear/editar un parque es una acción administrativa. */
const COMMAND_LEVEL = 4;

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user, rankLevel: access.rank?.level ?? 0 };
}

export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdStationsCollection();
    const docs = await col.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ success: true, stations: docs.map(({ _id, ...s }: any) => s) });
  } catch (error) {
    console.error('Error listando estaciones de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para registrar una estación` }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.address?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdStationsCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      name: String(body.name).trim().slice(0, 100),
      address: String(body.address).trim().slice(0, 150),
      apparatus: Array.isArray(body.apparatus) ? body.apparatus.slice(0, 20).map((a: string) => String(a).trim().slice(0, 30)) : [],
      notes: body.notes ? String(body.notes).trim().slice(0, 500) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'create_station', description: `Estación registrada: ${doc.name}` });
    return NextResponse.json({ success: true, station: doc });
  } catch (error) {
    console.error('Error registrando estación de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para editar una estación` }, { status: 403 });
  }

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdStationsCollection();
    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_station', description: `Estación actualizada: ${clean.name || id}` });
    return NextResponse.json({ success: true, station: clean });
  } catch (error) {
    console.error('Error actualizando estación de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

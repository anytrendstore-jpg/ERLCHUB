import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdEquipmentCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdEquipmentCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, equipment: docs.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error listando equipo de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre' }, { status: 400 });

    const col = await fdEquipmentCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      name: String(body.name).trim().slice(0, 100),
      category: body.category || 'Other',
      assetTag: body.assetTag ? String(body.assetTag).trim().slice(0, 50) : undefined,
      unit: body.unit ? String(body.unit).trim().slice(0, 20) : undefined,
      status: body.status || 'In Service',
      notes: body.notes ? String(body.notes).trim().slice(0, 500) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, item: doc });
  } catch (error) {
    console.error('Error agregando equipo de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdEquipmentCollection();
    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_equipment', description: `Equipo actualizado: ${clean.name || id}` });
    return NextResponse.json({ success: true, item: clean });
  } catch (error) {
    console.error('Error actualizando equipo de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

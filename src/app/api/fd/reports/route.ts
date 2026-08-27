import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdReportsCollection } from '@/lib/fdServer';
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
    const col = await fdReportsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, reports: docs.map(({ _id, ...r }: any) => r) });
  } catch (error) {
    console.error('Error listando reportes de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const body = await request.json();
    const col = await fdReportsCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      reportNumber: `FD-${1000 + count + 1}`,
      status: body.status || 'Draft',
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, report: doc });
  } catch (error) {
    console.error('Error creando reporte de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdReportsCollection();
    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, report: clean });
  } catch (error) {
    console.error('Error actualizando reporte de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

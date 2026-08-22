import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtReportsCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtReportsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, reports: docs.map(({ _id, ...r }: any) => r) });
  } catch (error) {
    console.error('Error listando reportes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtReportsCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      reportNumber: `RPT-${1000 + count + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, report: doc });
  } catch (error) {
    console.error('Error creando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtReportsCollection();
    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, report: clean });
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

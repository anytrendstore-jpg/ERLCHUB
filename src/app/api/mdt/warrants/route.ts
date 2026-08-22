import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtWarrantsCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtWarrantsCollection();
    const docs = await col.find({}).sort({ issuedDate: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, warrants: docs.map(({ _id, ...w }: any) => w) });
  } catch (error) {
    console.error('Error listando órdenes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtWarrantsCollection();
    const count = await col.countDocuments();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      warrantNumber: `WRT-${1000 + count + 1}`,
      issuedDate: new Date(),
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, warrant: doc });
  } catch (error) {
    console.error('Error creando orden:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtWarrantsCollection();
    await col.updateOne({ id }, { $set: updates });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, warrant: clean });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

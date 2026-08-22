import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtBolosCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtBolosCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, bolos: docs.map(({ _id, ...b }: any) => b) });
  } catch (error) {
    console.error('Error listando BOLOs:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtBolosCollection();
    const count = await col.countDocuments();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      boloNumber: `BOLO-${1000 + count + 1}`,
      createdAt: new Date(),
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, bolo: doc });
  } catch (error) {
    console.error('Error creando BOLO:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtBolosCollection();
    await col.updateOne({ id }, { $set: updates });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, bolo: clean });
  } catch (error) {
    console.error('Error actualizando BOLO:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

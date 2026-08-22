import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtVehiclesCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtVehiclesCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, vehicles: docs.map(({ _id, ...v }: any) => v) });
  } catch (error) {
    console.error('Error listando vehículos del MDT:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const now = new Date();
    const doc = { ...body, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const col = await mdtVehiclesCollection();
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, vehicle: doc });
  } catch (error) {
    console.error('Error creando vehículo del MDT:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtVehiclesCollection();
    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, vehicle: clean });
  } catch (error) {
    console.error('Error actualizando vehículo del MDT:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

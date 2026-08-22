import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtCallsCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtCallsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, calls: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando llamadas del CAD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const now = new Date();
    const col = await mdtCallsCollection();
    const count = await col.countDocuments();

    const doc = {
      id: crypto.randomUUID(),
      callNumber: String(5480 + count + 1),
      type: body.type || 'Other',
      priority: body.priority || 'Medium',
      status: body.status || 'Pending',
      location: body.location || '',
      coordinates: body.coordinates,
      description: body.description || '',
      caller: body.caller,
      assignedUnits: body.assignedUnits || [],
      createdAt: now,
      updatedAt: now,
      notes: body.notes || [],
      title: body.title,
      scene: body.scene,
    };
    await col.insertOne(doc as any);

    return NextResponse.json({ success: true, call: doc });
  } catch (error) {
    console.error('Error creando llamada del CAD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la llamada' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtCallsCollection();
    await col.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando llamada del CAD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtCallsCollection();
    const existing = await col.findOne({ id });
    if (!existing) return NextResponse.json({ success: false, error: 'Llamada no encontrada' }, { status: 404 });

    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, call: clean });
  } catch (error) {
    console.error('Error actualizando llamada del CAD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

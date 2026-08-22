import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtEvidenceCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtEvidenceCollection();
    const docs = await col.find({}).sort({ collectedAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, evidence: docs.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error listando evidencias:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtEvidenceCollection();
    const count = await col.countDocuments();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      evidenceNumber: `EVD-${1000 + count + 1}`,
      collectedAt: new Date(),
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, evidence: doc });
  } catch (error) {
    console.error('Error registrando evidencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

/** action: 'custody' añade una entrada a la cadena de custodia; cualquier otro campo se actualiza directo. */
export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, custodyEntry, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtEvidenceCollection();
    if (custodyEntry) {
      await col.updateOne({ id }, { $push: { chainOfCustody: custodyEntry }, ...(updates.custodyStatus ? { $set: { custodyStatus: updates.custodyStatus } } : {}) } as any);
    } else {
      await col.updateOne({ id }, { $set: updates });
    }
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, evidence: clean });
  } catch (error) {
    console.error('Error actualizando evidencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

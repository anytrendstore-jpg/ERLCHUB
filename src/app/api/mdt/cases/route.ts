import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtCasesCollection } from '@/lib/mdtServer';
import type { CaseActivityEntry, CaseNote } from '@/lib/mdtTypes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtCasesCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, cases: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando casos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtCasesCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const openActivity: CaseActivityEntry = {
      id: crypto.randomUUID(),
      actorId: body.leadOfficerId || '',
      actorName: body.leadOfficerName || '',
      action: 'Caso abierto',
      timestamp: now,
    };
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      caseNumber: `CASE-${1000 + count + 1}`,
      status: body.status || 'Open',
      assignedOfficerIds: body.assignedOfficerIds || [],
      assignedOfficerNames: body.assignedOfficerNames || [],
      relatedPersonIds: body.relatedPersonIds || [],
      relatedVehicleIds: body.relatedVehicleIds || [],
      relatedEvidenceIds: body.relatedEvidenceIds || [],
      relatedCallIds: body.relatedCallIds || [],
      notes: [] as CaseNote[],
      activity: [openActivity],
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, case: doc });
  } catch (error) {
    console.error('Error creando caso:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id, addNote, addActivity, actorId, actorName, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtCasesCollection();
    const now = new Date();
    const setFields: Record<string, unknown> = { ...updates, updatedAt: now };
    if (updates.status === 'Closed') setFields.closedAt = now;

    if (addNote) {
      const note: CaseNote = { id: crypto.randomUUID(), authorId: actorId || '', authorName: actorName || '', text: addNote, createdAt: now };
      await col.updateOne({ id }, { $push: { notes: note } as any, $set: setFields });
    } else if (addActivity) {
      const entry: CaseActivityEntry = { id: crypto.randomUUID(), actorId: actorId || '', actorName: actorName || '', action: addActivity, timestamp: now };
      await col.updateOne({ id }, { $push: { activity: entry } as any, $set: setFields });
    } else {
      await col.updateOne({ id }, { $set: setFields });
    }

    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, case: clean });
  } catch (error) {
    console.error('Error actualizando caso:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

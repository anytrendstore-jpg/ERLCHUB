import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdCasesCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

/** Investigaciones — casos de causa de incendio sospechosa, distintos de un reporte de incidente de rutina (fd_reports). */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdCasesCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, cases: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando investigaciones de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.narrative?.trim() || !body.location?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdCasesCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      caseNumber: `FD-C-${1000 + count + 1}`,
      title: String(body.title).trim().slice(0, 150),
      narrative: String(body.narrative).trim().slice(0, 4000),
      status: 'Open' as const,
      relatedCallId: body.relatedCallId || undefined,
      leadFirefighterId: user.id,
      leadFirefighterName: user.displayName,
      location: String(body.location).trim().slice(0, 150),
      openedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'open_case', description: `Investigación abierta: ${doc.caseNumber} — ${doc.title}` });
    return NextResponse.json({ success: true, case: doc });
  } catch (error) {
    console.error('Error abriendo investigación de LSFD:', error);
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

    const col = await fdCasesCollection();
    const set: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if (updates.status === 'Closed' && !updates.closedAt) set.closedAt = new Date();

    await col.updateOne({ id }, { $set: set });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_case', description: `Investigación actualizada: ${clean.caseNumber || id}` });
    return NextResponse.json({ success: true, case: clean });
  } catch (error) {
    console.error('Error actualizando investigación de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

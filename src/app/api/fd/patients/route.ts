import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdPatientsCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

/** Atención prehospitalaria (EMS/PCR) — registro del paciente, separado del reporte del incidente (fd_reports). */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdPatientsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, patients: docs.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando pacientes de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.chiefComplaint?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdPatientsCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      callId: body.callId || undefined,
      name: String(body.name).trim().slice(0, 100),
      ageEstimate: body.ageEstimate ? String(body.ageEstimate).trim().slice(0, 20) : undefined,
      chiefComplaint: String(body.chiefComplaint).trim().slice(0, 300),
      vitals: {
        bp: body.vitals?.bp || undefined,
        hr: body.vitals?.hr || undefined,
        rr: body.vitals?.rr || undefined,
        spo2: body.vitals?.spo2 || undefined,
        gcs: body.vitals?.gcs || undefined,
      },
      treatment: body.treatment ? String(body.treatment).trim().slice(0, 1000) : undefined,
      hospital: body.hospital ? String(body.hospital).trim().slice(0, 100) : undefined,
      status: body.status || 'Treated on Scene',
      treatedById: user.id,
      treatedByName: user.displayName,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'log_patient', description: `Paciente registrado: ${doc.name} — ${doc.chiefComplaint}` });
    return NextResponse.json({ success: true, patient: doc });
  } catch (error) {
    console.error('Error registrando paciente de LSFD:', error);
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

    const col = await fdPatientsCollection();
    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_patient', description: `Paciente actualizado: ${clean.name || id}` });
    return NextResponse.json({ success: true, patient: clean });
  } catch (error) {
    console.error('Error actualizando paciente de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

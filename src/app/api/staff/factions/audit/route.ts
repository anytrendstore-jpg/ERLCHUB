import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import {
  factionAuditCollection, factionInvestigationsCollection, legalFactionsCollection,
  type FactionInvestigationStatus,
} from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

const STATUSES: FactionInvestigationStatus[] = ['open', 'investigating', 'review', 'resolved', 'archived'];

/** Requiere factions.audit.view. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('factions.audit.view');
  if (denied) return denied;

  try {
    const sp = request.nextUrl.searchParams;
    const filter: Record<string, unknown> = {};
    if (sp.get('factionId')) filter.factionId = sp.get('factionId');
    if (sp.get('actorName')) filter.actorName = sp.get('actorName');
    if (sp.get('action')) filter.action = sp.get('action');
    if (sp.get('severity')) filter.severity = sp.get('severity');

    const auditCol = await factionAuditCollection();
    const entries = await auditCol.find(filter).sort({ createdAt: -1 }).limit(300).toArray();

    const invCol = await factionInvestigationsCollection();
    const investigations = await invCol.find({}).sort({ createdAt: -1 }).limit(100).toArray();

    return NextResponse.json({
      success: true,
      entries: entries.map(({ _id, ...e }: any) => e),
      investigations: investigations.map(({ _id, ...i }: any) => i),
    });
  } catch (error) {
    console.error('Error leyendo auditoría de facciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crear una investigación a partir de una irregularidad detectada. Requiere factions.investigate. */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('factions.investigate');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { factionId, involvedNames, reason } = await request.json();
    if (!factionId || !reason?.trim()) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const factionsCol = await legalFactionsCollection();
    const faction = await factionsCol.findOne({ id: factionId });
    if (!faction) return NextResponse.json({ success: false, error: 'Facción no encontrada' }, { status: 404 });

    const now = new Date();
    const investigation = {
      id: crypto.randomUUID(), factionId, factionName: faction.name,
      involvedNames: Array.isArray(involvedNames) ? involvedNames : [],
      reason: reason.trim(), evidence: [], status: 'open' as FactionInvestigationStatus,
      createdBy: identity.name, createdAt: now, updatedAt: now,
    };
    const invCol = await factionInvestigationsCollection();
    await invCol.insertOne(investigation);
    await logStaffAction({ type: 'faction_investigation_created', category: 'STAFF', actor: identity.name, actorId: identity.id, target: faction.name, description: `${identity.name} abrió una investigación sobre ${faction.name}` });
    return NextResponse.json({ success: true, investigation });
  } catch (error) {
    console.error('Error creando investigación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la investigación' }, { status: 500 });
  }
}

/** Acciones: add_evidence, set_investigator, change_status, resolve. Requiere factions.investigate. */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('factions.investigate');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const body = await request.json();
    const { investigationId, action } = body;
    if (!investigationId || !action) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });

    const col = await factionInvestigationsCollection();
    const investigation = await col.findOne({ id: investigationId });
    if (!investigation) return NextResponse.json({ success: false, error: 'Investigación no encontrada' }, { status: 404 });

    const now = new Date();
    switch (action) {
      case 'add_evidence':
        if (!body.text?.trim()) return NextResponse.json({ success: false, error: 'La evidencia no puede estar vacía' }, { status: 400 });
        await col.updateOne({ id: investigationId }, { $push: { evidence: { id: crypto.randomUUID(), text: body.text.trim(), addedBy: identity.name, addedAt: now } }, $set: { updatedAt: now } });
        break;
      case 'set_investigator':
        if (!body.investigatorName?.trim()) return NextResponse.json({ success: false, error: 'Falta el investigador' }, { status: 400 });
        await col.updateOne({ id: investigationId }, { $set: { investigatorName: body.investigatorName.trim(), updatedAt: now } });
        break;
      case 'change_status': {
        const status: FactionInvestigationStatus = body.status;
        if (!STATUSES.includes(status)) return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
        await col.updateOne({ id: investigationId }, { $set: { status, updatedAt: now } });
        break;
      }
      case 'resolve':
        if (!body.resolution?.trim()) return NextResponse.json({ success: false, error: 'Falta la resolución' }, { status: 400 });
        await col.updateOne({ id: investigationId }, { $set: { status: 'resolved', resolution: body.resolution.trim(), updatedAt: now } });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Acción desconocida' }, { status: 400 });
    }

    await logStaffAction({ type: 'faction_investigation_updated', category: 'STAFF', actor: identity.name, actorId: identity.id, target: investigation.factionName, description: `${identity.name} actualizó la investigación de ${investigation.factionName} (${action})` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando investigación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar la investigación' }, { status: 500 });
  }
}

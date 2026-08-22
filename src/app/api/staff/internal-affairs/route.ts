import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import {
  iaCasesCollection, nextIACaseNumber, newIACase,
  type IACaseType, type IAPriority, type IAStatus,
} from '@/lib/internalAffairsServer';

export const dynamic = 'force-dynamic';

const CASE_TYPES: IACaseType[] = ['abuse_of_power', 'negligence', 'corruption', 'unprofessional_conduct', 'policy_violation', 'other'];
const PRIORITIES: IAPriority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: IAStatus[] = ['open', 'investigating', 'review', 'resolved', 'archived'];

/** Requiere internal_affairs.view. Cada acceso queda auditado (sección "Seguridad" del spec). */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('internal_affairs.view');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const id = request.nextUrl.searchParams.get('id');
    const col = await iaCasesCollection();

    if (id) {
      const doc = await col.findOne({ id });
      if (!doc) return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
      await logStaffAction({
        type: 'internal_affairs_accessed', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id,
        target: doc.targetStaffName, targetId: doc.id,
        description: `${identity?.name || 'Staff'} consultó el caso interno #${doc.caseNumber} (${doc.targetStaffName})`,
      });
      const { _id, ...clean } = doc as any;
      return NextResponse.json({ success: true, case: clean });
    }

    const docs = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray();
    await logStaffAction({
      type: 'internal_affairs_accessed', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id,
      description: `${identity?.name || 'Staff'} consultó la lista de casos de Asuntos Internos`,
    });
    return NextResponse.json({ success: true, cases: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error leyendo Asuntos Internos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crear un caso nuevo. Requiere internal_affairs.manage. */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('internal_affairs.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const body = await request.json();
    const { targetStaffName, department, type, priority, description } = body;
    if (!targetStaffName?.trim() || !CASE_TYPES.includes(type) || !PRIORITIES.includes(priority) || !description?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos o son inválidos' }, { status: 400 });
    }

    const col = await iaCasesCollection();
    const caseNumber = await nextIACaseNumber(col);
    const doc = newIACase({
      targetStaffId: body.targetStaffId, targetStaffName: targetStaffName.trim(),
      department: department?.trim() || undefined, type, priority,
      description: description.trim(), createdBy: identity.name, createdById: identity.id, caseNumber,
    });
    await col.insertOne(doc);
    await logStaffAction({
      type: 'internal_affairs_case_created', category: 'STAFF', actor: identity.name, actorId: identity.id,
      target: doc.targetStaffName, targetId: doc.id,
      description: `${identity.name} abrió el caso interno #${doc.caseNumber} sobre ${doc.targetStaffName}`,
    });
    return NextResponse.json({ success: true, case: doc });
  } catch (error) {
    console.error('Error creando caso interno:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el caso' }, { status: 500 });
  }
}

/**
 * Acciones: add_note | add_evidence | add_timeline | set_investigator |
 * change_status | resolve. Todas exigen Director y quedan auditadas.
 */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('internal_affairs.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const body = await request.json();
    const { caseId, action } = body;
    if (!caseId || !action) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });

    const col = await iaCasesCollection();
    const existing = await col.findOne({ id: caseId });
    if (!existing) return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });

    const crypto = await import('crypto');
    const now = new Date();
    let logDescription = '';

    switch (action) {
      case 'add_note': {
        if (!body.text?.trim()) return NextResponse.json({ success: false, error: 'La nota no puede estar vacía' }, { status: 400 });
        await col.updateOne({ id: caseId }, {
          $push: { notes: { id: crypto.randomUUID(), body: body.text.trim(), author: identity.name, createdAt: now } },
          $set: { updatedAt: now },
        });
        logDescription = `${identity.name} añadió una nota al caso #${existing.caseNumber}`;
        break;
      }
      case 'add_evidence': {
        if (!body.text?.trim()) return NextResponse.json({ success: false, error: 'La evidencia no puede estar vacía' }, { status: 400 });
        await col.updateOne({ id: caseId }, {
          $push: { evidence: { id: crypto.randomUUID(), text: body.text.trim(), url: body.url?.trim() || undefined, addedBy: identity.name, addedAt: now } },
          $set: { updatedAt: now },
        });
        logDescription = `${identity.name} añadió evidencia al caso #${existing.caseNumber}`;
        break;
      }
      case 'set_investigator': {
        if (!body.investigatorName?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre del investigador' }, { status: 400 });
        await col.updateOne({ id: caseId }, {
          $set: { investigatorId: body.investigatorId, investigatorName: body.investigatorName.trim(), updatedAt: now },
          $push: { timeline: { id: crypto.randomUUID(), label: `Investigador asignado: ${body.investigatorName.trim()}`, createdAt: now } },
        });
        logDescription = `${identity.name} asignó a ${body.investigatorName.trim()} como investigador del caso #${existing.caseNumber}`;
        break;
      }
      case 'change_status': {
        const status: IAStatus = body.status;
        if (!STATUSES.includes(status)) return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
        await col.updateOne({ id: caseId }, {
          $set: { status, updatedAt: now },
          $push: { timeline: { id: crypto.randomUUID(), label: `Estado cambiado a "${status}"`, createdAt: now } },
        });
        logDescription = `${identity.name} cambió el estado del caso #${existing.caseNumber} a "${status}"`;
        break;
      }
      case 'resolve': {
        if (!body.resolution?.trim()) return NextResponse.json({ success: false, error: 'Falta la resolución' }, { status: 400 });
        await col.updateOne({ id: caseId }, {
          $set: { status: 'resolved', resolution: body.resolution.trim(), updatedAt: now },
          $push: { timeline: { id: crypto.randomUUID(), label: 'Caso resuelto', createdAt: now } },
        });
        logDescription = `${identity.name} resolvió el caso #${existing.caseNumber}`;
        break;
      }
      default:
        return NextResponse.json({ success: false, error: 'Acción desconocida' }, { status: 400 });
    }

    await logStaffAction({
      type: 'internal_affairs_case_updated', category: 'STAFF', actor: identity.name, actorId: identity.id,
      target: existing.targetStaffName, targetId: existing.id, description: logDescription,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando caso interno:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar el caso' }, { status: 500 });
  }
}

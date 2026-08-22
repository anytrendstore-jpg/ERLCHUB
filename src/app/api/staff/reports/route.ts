import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logStaffAction, staffIdentity, staffReports, type ReportStatus, type ReportPriority } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

const STATUSES: ReportStatus[] = ['open', 'in_review', 'assigned', 'investigating', 'resolved', 'dismissed'];
const PRIORITIES: ReportPriority[] = ['low', 'medium', 'high', 'critical'];
const ESCALATION_ORDER: ReportPriority[] = ['low', 'medium', 'high', 'critical'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('reports.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10) || 30));
    const sort = searchParams.get('sort') === 'oldest' ? 1 : -1;

    const col = await staffReports();
    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;

    const [docs, matched] = await Promise.all([
      col.find(query).sort({ createdAt: sort }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col.countDocuments(query),
    ]);
    return NextResponse.json({
      success: true,
      reports: docs.map(({ _id, ...r }: any) => r),
      page, pageSize, matched, totalPages: Math.max(1, Math.ceil(matched / pageSize)),
      pending: await col.countDocuments({ status: { $in: ['open', 'in_review'] } }),
    });
  } catch (error) {
    console.error('Error listando reportes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('reports.view');
  if (denied) return denied;

  try {
    const { reporterName, targetName, reason, details, priority } = await request.json();
    if (!reporterName?.trim() || !targetName?.trim() || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos del reporte' }, { status: 400 });
    }

    const col = await staffReports();
    const doc = {
      id: crypto.randomUUID(),
      reporterName: reporterName.trim(),
      targetName: targetName.trim(),
      reason: reason.trim(),
      details: (details || '').trim(),
      status: 'open' as ReportStatus,
      priority: (PRIORITIES.includes(priority) ? priority : 'medium') as ReportPriority,
      createdAt: new Date(),
    };
    await col.insertOne(doc);
    const { _id, ...report } = doc as typeof doc & { _id?: unknown };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar el reporte' }, { status: 500 });
  }
}

/** action: 'escalate' sube la prioridad un nivel; si no, cambia `status` (y opcionalmente `assignedTo`). */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('reports.manage');
  if (denied) return denied;

  try {
    const { id, status, resolution, assignedTo, action } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const identity = staffIdentity();
    const col = await staffReports();
    const doc = await col.findOne({ id });
    if (!doc) return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });

    if (action === 'take') {
      await col.updateOne({ id }, { $set: { status: 'assigned', assignedTo: identity?.name || 'Staff', assignedToId: identity?.id } });
      await logStaffAction({
        type: 'report_assigned', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id, target: doc.targetName,
        description: `${identity?.name || 'Staff'} tomó el reporte contra ${doc.targetName}`,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'escalate') {
      const currentIndex = ESCALATION_ORDER.indexOf(doc.priority || 'medium');
      const nextPriority = ESCALATION_ORDER[Math.min(currentIndex + 1, ESCALATION_ORDER.length - 1)];
      await col.updateOne({ id }, { $set: { priority: nextPriority } });
      await logStaffAction({
        type: 'report_escalated', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id, target: doc.targetName,
        description: `${identity?.name || 'Staff'} escaló el reporte contra ${doc.targetName} a prioridad "${nextPriority}"`,
      });
      return NextResponse.json({ success: true, priority: nextPriority });
    }

    if (!STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 });
    }

    const isClosing = status === 'resolved' || status === 'dismissed';
    const update: Record<string, unknown> = {
      status,
      resolution: resolution ?? doc.resolution,
      handledBy: identity?.name || 'Staff',
      ...(isClosing ? { resolvedAt: new Date() } : {}),
    };
    if (typeof assignedTo === 'string') {
      update.assignedTo = assignedTo.trim() || undefined;
      update.assignedToId = assignedTo.trim() ? identity?.id : undefined;
    }
    await col.updateOne({ id }, { $set: update });

    if (status === 'assigned') {
      await logStaffAction({
        type: 'report_assigned', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id, target: doc.targetName,
        description: `${identity?.name || 'Staff'} asignó el reporte contra ${doc.targetName} a ${update.assignedTo || identity?.name || 'Staff'}`,
      });
    } else if (isClosing) {
      await logStaffAction({
        type: 'report_resolved',
        category: 'STAFF',
        actor: identity?.name || 'Staff',
        actorId: identity?.id,
        target: doc.targetName,
        description: `${identity?.name || 'Staff'} ${status === 'resolved' ? 'resolvió' : 'descartó'} el reporte contra ${doc.targetName}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

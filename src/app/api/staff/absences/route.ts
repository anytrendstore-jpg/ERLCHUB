import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireStaff, staffIdentity, staffAbsences, logStaffAction } from '@/lib/staffServer';
import { requirePermission, hasPermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Directores ven todas las solicitudes; el resto del staff solo ve las propias. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const col = await staffAbsences();
    const canManage = await hasPermission(identity, 'absences.manage');
    const docs = await col.find(canManage ? {} : { staffId: identity.id }).sort({ createdAt: -1 }).limit(200).toArray();

    return NextResponse.json({ success: true, absences: docs.map(({ _id, ...a }: any) => a), isDirector: canManage });
  } catch (error) {
    console.error('Error leyendo ausencias:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Cualquier miembro del staff puede solicitar una ausencia. */
export async function POST(request: NextRequest) {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { type, startDate, endDate, reason } = await request.json();
    if (!['vacation', 'permission', 'sick'].includes(type) || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ success: false, error: 'La fecha de fin no puede ser anterior a la de inicio' }, { status: 400 });
    }

    const col = await staffAbsences();
    const doc = {
      id: crypto.randomUUID(), staffId: identity.id, staffName: identity.name, type,
      startDate, endDate, reason: reason.trim(), status: 'pending' as const, createdAt: new Date(),
    };
    await col.insertOne(doc);
    await logStaffAction({
      type: 'absence_requested', category: 'STAFF', actor: identity.name, actorId: identity.id,
      description: `${identity.name} solicitó una ausencia (${type}) del ${startDate} al ${endDate}`,
    });
    return NextResponse.json({ success: true, absence: doc });
  } catch (error) {
    console.error('Error solicitando ausencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar la solicitud' }, { status: 500 });
  }
}

/** Requiere absences.manage. action: 'approve' | 'reject' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('absences.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const { absenceId, action, reviewNote } = await request.json();
    if (!absenceId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const col = await staffAbsences();
    const absence = await col.findOne({ id: absenceId });
    if (!absence) return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    if (absence.status !== 'pending') return NextResponse.json({ success: false, error: 'Esta solicitud ya fue revisada' }, { status: 400 });

    const status = action === 'approve' ? 'approved' : 'rejected';
    await col.updateOne({ id: absenceId }, { $set: { status, reviewedBy: identity?.name || 'Staff', reviewNote: reviewNote?.trim() || undefined, reviewedAt: new Date() } });
    await logStaffAction({
      type: 'absence_reviewed', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id, target: absence.staffName,
      description: `${identity?.name || 'Staff'} ${status === 'approved' ? 'aprobó' : 'rechazó'} la solicitud de ausencia de ${absence.staffName}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revisando ausencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

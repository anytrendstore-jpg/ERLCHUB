import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logStaffAction, staffIdentity, staffSanctions, type SanctionType } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

const TYPES: SanctionType[] = ['warn', 'kick', 'temp_ban', 'perm_ban', 'restriction', 'suspension'];
const TYPE_LABEL: Record<SanctionType, string> = {
  warn: 'Advertencia', kick: 'Expulsión', temp_ban: 'Ban temporal', perm_ban: 'Ban permanente',
  restriction: 'Restricción', suspension: 'Suspensión',
};
const TIMED_TYPES: SanctionType[] = ['temp_ban', 'restriction', 'suspension'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('sanctions.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10) || 30));
    const sort = searchParams.get('sort') === 'oldest' ? 1 : -1;

    const col = await staffSanctions();
    const query: Record<string, unknown> = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ targetName: rx }, { reason: rx }];
    }

    const [docs, matched] = await Promise.all([
      col.find(query).sort({ createdAt: sort }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col.countDocuments(query),
    ]);
    return NextResponse.json({
      success: true,
      sanctions: docs.map(({ _id, ...s }: any) => s),
      page, pageSize, matched, totalPages: Math.max(1, Math.ceil(matched / pageSize)),
      total: await col.countDocuments({}),
      active: await col.countDocuments({ active: true }),
    });
  } catch (error) {
    console.error('Error listando sanciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('sanctions.manage');
  if (denied) return denied;

  try {
    const { type, targetName, reason, durationHours } = await request.json();

    if (!TYPES.includes(type) || !targetName?.trim() || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos de la sanción' }, { status: 400 });
    }

    const identity = staffIdentity();
    const col = await staffSanctions();
    const doc = {
      id: crypto.randomUUID(),
      type: type as SanctionType,
      targetName: targetName.trim(),
      reason: reason.trim(),
      durationHours: TIMED_TYPES.includes(type as SanctionType) ? Number(durationHours) || 24 : undefined,
      issuedBy: identity?.name || 'Staff',
      issuedById: identity?.id,
      active: true,
      createdAt: new Date(),
    };
    await col.insertOne(doc);
    const { _id, ...sanction } = doc as typeof doc & { _id?: unknown };

    await logStaffAction({
      type: 'sanction_issued',
      category: 'SANCION',
      actor: doc.issuedBy,
      actorId: identity?.id,
      target: doc.targetName,
      description: `${identity?.name || 'Staff'} aplicó ${TYPE_LABEL[doc.type]} a ${doc.targetName} por ${doc.reason}`,
    });

    return NextResponse.json({ success: true, sanction });
  } catch (error) {
    console.error('Error creando sanción:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar la sanción' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('sanctions.manage');
  if (denied) return denied;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const identity = staffIdentity();
    const col = await staffSanctions();
    const doc = await col.findOne({ id });
    if (!doc) return NextResponse.json({ success: false, error: 'Sanción no encontrada' }, { status: 404 });

    await col.updateOne({ id }, { $set: { active: false, revokedAt: new Date(), revokedBy: identity?.name || 'Staff' } });

    await logStaffAction({
      type: 'sanction_revoked',
      category: 'SANCION',
      actor: identity?.name || 'Staff',
      actorId: identity?.id,
      target: doc.targetName,
      description: `${identity?.name || 'Staff'} revocó la sanción de ${doc.targetName}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revocando sanción:', error);
    return NextResponse.json({ success: false, error: 'No se pudo revocar' }, { status: 500 });
  }
}

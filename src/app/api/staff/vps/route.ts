import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { vpsPlansCollection, vpsSubscriptionsCollection, ensureVpsPlansSeeded } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const plansCol = await ensureVpsPlansSeeded();
    const subsCol = await vpsSubscriptionsCollection();

    const [plans, allSubs] = await Promise.all([
      plansCol.find({}).sort({ order: 1 }).toArray(),
      subsCol.find({}).toArray(),
    ]);

    const distinctUsers = new Set(allSubs.map((s) => s.discordId));
    const stats = {
      activeCount: allSubs.filter((s) => s.status === 'active').length,
      expiredCount: allSubs.filter((s) => s.status === 'expired').length,
      totalSold: allSubs.length,
      revenue: allSubs.reduce((sum, s) => sum + s.dailyPrice, 0),
      activeUsers: distinctUsers.size,
      renewals: Math.max(0, allSubs.length - distinctUsers.size),
    };

    return NextResponse.json({ success: true, plans: plans.map(({ _id, ...p }: any) => p), stats });
  } catch (error) {
    console.error('Error leyendo administración de VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/**
 * action: 'create' | 'update' | 'toggle'
 * create: { name, dailyPrice, securityLevel, description }
 * update: { id, name?, dailyPrice?, securityLevel?, description? }
 * toggle: { id }
 */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const body = await request.json();
    const col = await vpsPlansCollection();

    if (body.action === 'create') {
      const { name, dailyPrice, securityLevel, durationHours, description } = body;
      if (!name || !dailyPrice || securityLevel === undefined || !durationHours) {
        return NextResponse.json({ success: false, error: 'Faltan campos' }, { status: 400 });
      }
      const count = await col.countDocuments();
      const doc = {
        id: crypto.randomUUID(), name, dailyPrice: Number(dailyPrice), securityLevel: Number(securityLevel),
        durationHours: Number(durationHours),
        description: description || '', enabled: true, order: count, createdAt: new Date(), updatedBy: identity?.name || 'Staff',
      };
      await col.insertOne(doc);
      await logStaffAction({
        type: 'vps_plan_created', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id, target: name,
        description: `${identity?.name || 'Staff'} creó el plan de VPS "${name}" ($${dailyPrice.toLocaleString('es-CO')}/día)`,
      });
      return NextResponse.json({ success: true, plan: doc });
    }

    if (body.action === 'update') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });
      const allowed: Record<string, unknown> = {};
      for (const key of ['name', 'dailyPrice', 'securityLevel', 'durationHours', 'description'] as const) {
        if (key in updates) allowed[key] = updates[key];
      }
      allowed.updatedBy = identity?.name || 'Staff';
      await col.updateOne({ id }, { $set: allowed });
      await logStaffAction({
        type: 'vps_plan_updated', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id, target: id,
        description: `${identity?.name || 'Staff'} actualizó el plan de VPS (${id})`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'toggle') {
      const { id } = body;
      const plan = await col.findOne({ id });
      if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
      await col.updateOne({ id }, { $set: { enabled: !plan.enabled, updatedBy: identity?.name || 'Staff' } });
      await logStaffAction({
        type: 'vps_plan_updated', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id, target: plan.name,
        description: `${identity?.name || 'Staff'} ${plan.enabled ? 'desactivó' : 'activó'} el plan de VPS "${plan.name}"`,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error administrando VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

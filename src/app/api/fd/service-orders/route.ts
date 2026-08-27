import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdServiceOrdersCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

/** Órdenes de servicio — pedidos de mantenimiento/trabajo, baja fricción como fd_reports: cualquier miembro activo abre y actualiza. */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdServiceOrdersCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, orders: docs.map(({ _id, ...o }: any) => o) });
  } catch (error) {
    console.error('Error listando órdenes de servicio de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const body = await request.json();
    if (!body.subject?.trim() || !body.description?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdServiceOrdersCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      orderNumber: `FD-SO-${1000 + count + 1}`,
      subject: String(body.subject).trim().slice(0, 150),
      description: String(body.description).trim().slice(0, 2000),
      priority: body.priority || 'Medium',
      status: 'Open' as const,
      relatedEquipment: body.relatedEquipment ? String(body.relatedEquipment).trim().slice(0, 100) : undefined,
      requestedById: user.id,
      requestedByName: user.displayName,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'create_service_order', description: `Orden de servicio creada: ${doc.orderNumber} — ${doc.subject}` });
    return NextResponse.json({ success: true, order: doc });
  } catch (error) {
    console.error('Error creando orden de servicio de LSFD:', error);
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

    const col = await fdServiceOrdersCollection();
    const set: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if (updates.status === 'Completed' && !updates.completedAt) set.completedAt = new Date();

    await col.updateOne({ id }, { $set: set });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_service_order', description: `Orden de servicio actualizada: ${clean.orderNumber || id}` });
    return NextResponse.json({ success: true, order: clean });
  } catch (error) {
    console.error('Error actualizando orden de servicio de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

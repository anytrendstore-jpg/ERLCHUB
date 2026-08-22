import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  economyItems,
  logStaffAction,
  staffIdentity,
  type EconomyModule,
} from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

const MODULES: EconomyModule[] = ['catalog', 'jobs', 'casino', 'companies', 'vehicles', 'weapons', 'market', 'illegal'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') as EconomyModule | null;
    if (!module || !MODULES.includes(module)) {
      return NextResponse.json({ success: false, error: 'Módulo no válido' }, { status: 400 });
    }

    const col = await economyItems();
    const docs = await col.find({ module }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, items: docs.map(({ _id, ...i }: any) => i) });
  } catch (error) {
    console.error('Error listando items de economía:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { module, name, fields } = await request.json();
    if (!MODULES.includes(module) || !name?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos del artículo' }, { status: 400 });
    }

    const identity = staffIdentity();
    const now = new Date();
    const col = await economyItems();
    const doc = {
      id: crypto.randomUUID(),
      module: module as EconomyModule,
      name: name.trim(),
      fields: fields || {},
      active: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: identity?.name || 'Director',
    };
    await col.insertOne(doc);
    const { _id, ...item } = doc as typeof doc & { _id?: unknown };

    await logStaffAction({
      type: 'economy_item_created',
      category: 'ECONOMIA',
      actor: item.updatedBy,
      actorId: identity?.id,
      target: item.name,
      description: `${item.updatedBy} creó "${item.name}" en ${module}`,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error creando item de economía:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar el artículo' }, { status: 500 });
  }
}

/** action: 'update' | 'toggle' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { id, action, name, fields, active } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await economyItems();
    const existing = await col.findOne({ id });
    if (!existing) return NextResponse.json({ success: false, error: 'Artículo no encontrado' }, { status: 404 });

    const identity = staffIdentity();
    const now = new Date();
    const update: Record<string, unknown> = { updatedAt: now, updatedBy: identity?.name || 'Director' };

    if (action === 'toggle') {
      update.active = !existing.active;
    } else {
      if (name?.trim()) update.name = name.trim();
      if (fields) update.fields = fields;
      if (typeof active === 'boolean') update.active = active;
    }

    await col.updateOne({ id }, { $set: update });

    await logStaffAction({
      type: 'economy_item_updated',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      target: existing.name,
      description: `${identity?.name || 'Director'} actualizó "${existing.name}" en ${existing.module}`,
    });

    const fresh = await col.findOne({ id });
    const { _id, ...item } = fresh as any;
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error actualizando item de economía:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await economyItems();
    const existing = await col.findOne({ id });
    await col.deleteOne({ id });

    if (existing) {
      const identity = staffIdentity();
      await logStaffAction({
        type: 'economy_item_deleted',
        category: 'ECONOMIA',
        actor: identity?.name || 'Director',
        actorId: identity?.id,
        target: existing.name,
        description: `${identity?.name || 'Director'} eliminó "${existing.name}" de ${existing.module}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando item de economía:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

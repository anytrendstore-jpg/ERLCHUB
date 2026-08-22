import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { ensureOsModulesSeeded } from '@/lib/osServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requirePermission('system_modules.view');
  if (denied) return denied;

  try {
    const col = await ensureOsModulesSeeded();
    const docs = await col.find({}).toArray();
    return NextResponse.json({ success: true, modules: docs.map(({ _id, ...m }: any) => m) });
  } catch (error) {
    console.error('Error listando módulos del OS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'toggle' | undefined (undefined = edición de campos) */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('system_modules.manage');
  if (denied) return denied;

  try {
    const { id, action, name, description, requiresStaff: requiresStaffField } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await ensureOsModulesSeeded();
    const existing = await col.findOne({ id });
    if (!existing) return NextResponse.json({ success: false, error: 'Módulo no encontrado' }, { status: 404 });

    const identity = staffIdentity();
    const now = new Date();
    const update: Record<string, unknown> = { updatedAt: now, updatedBy: identity?.name || 'Staff' };

    if (action === 'toggle') {
      update.enabled = !existing.enabled;
    } else {
      if (name?.trim()) update.name = name.trim();
      if (description?.trim()) update.description = description.trim();
      if (typeof requiresStaffField === 'boolean') update.requiresStaff = requiresStaffField;
    }

    await col.updateOne({ id }, { $set: update });

    await logStaffAction({
      type: action === 'toggle' ? 'os_module_toggled' : 'os_module_updated',
      category: 'SYSTEM',
      actor: identity?.name || 'Staff',
      actorId: identity?.id,
      target: id,
      description: `${identity?.name || 'Staff'} ${action === 'toggle' ? (update.enabled ? 'activó' : 'desactivó') : 'editó'} el módulo "${id}"`,
    });

    const fresh = await col.findOne({ id });
    const { _id, ...module_ } = fresh as any;
    return NextResponse.json({ success: true, module: module_ });
  } catch (error) {
    console.error('Error actualizando módulo del OS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireStaff, staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requireCEO, ensureRolesSeeded, staffRolesCollection, staffRoleAssignmentsCollection, getHierarchy, canManageHierarchy } from '@/lib/permissions/engine';
import { isValidPermissionKey } from '@/lib/permissions/catalog';

export const dynamic = 'force-dynamic';

/** Lista de rangos: visible para cualquier Staff (transparencia de la jerarquía). */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    await ensureRolesSeeded();
    const col = await staffRolesCollection();
    const roles = await col.find({}).sort({ hierarchy: -1 }).toArray();
    return NextResponse.json({ success: true, roles: roles.map(({ _id, ...r }: any) => r) });
  } catch (error) {
    console.error('Error leyendo rangos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crear un rango nuevo. Solo quien tenga permissions.manage (CEO por defecto). */
export async function POST(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { name, category, hierarchy, scope, department, color } = await request.json();
    if (!name?.trim() || !category?.trim() || typeof hierarchy !== 'number' || !scope) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const actorHierarchy = await getHierarchy(identity);
    if (!canManageHierarchy(actorHierarchy, hierarchy) && hierarchy >= actorHierarchy) {
      return NextResponse.json({ success: false, error: 'No podés crear un rango con jerarquía igual o superior a la tuya' }, { status: 403 });
    }

    const col = await staffRolesCollection();
    const now = new Date();
    const role = {
      id: crypto.randomUUID(), key: `custom_${crypto.randomUUID().slice(0, 8)}`, name: name.trim(),
      category: category.trim(), hierarchy, scope, department: department?.trim() || undefined,
      permissions: [] as string[], color: color || '#64748b', createdAt: now, updatedAt: now, updatedBy: identity.name,
    };
    await col.insertOne(role);
    await logStaffAction({ type: 'permission_role_created', category: 'STAFF', actor: identity.name, actorId: identity.id, target: role.name, description: `${identity.name} creó el rango "${role.name}"` });
    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error creando rango:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el rango' }, { status: 500 });
  }
}

/**
 * Editar un rango: name, category, hierarchy, scope, department, color,
 * o togglePermission (activa/desactiva una clave puntual). Solo CEO.
 */
export async function PATCH(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const body = await request.json();
    const { roleId } = body;
    if (!roleId) return NextResponse.json({ success: false, error: 'Falta el rango' }, { status: 400 });

    const col = await staffRolesCollection();
    const role = await col.findOne({ id: roleId });
    if (!role) return NextResponse.json({ success: false, error: 'Rango no encontrado' }, { status: 404 });
    if (role.permissions.includes('*')) {
      return NextResponse.json({ success: false, error: 'El rango de control absoluto no puede modificarse' }, { status: 400 });
    }

    const actorHierarchy = await getHierarchy(identity);
    if (!canManageHierarchy(actorHierarchy, role.hierarchy)) {
      return NextResponse.json({ success: false, error: 'No podés modificar un rango de jerarquía igual o superior a la tuya' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date(), updatedBy: identity.name };
    let logDescription = `${identity.name} editó el rango "${role.name}"`;

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.category === 'string' && body.category.trim()) updates.category = body.category.trim();
    if (typeof body.department === 'string') updates.department = body.department.trim() || undefined;
    if (typeof body.color === 'string') updates.color = body.color;
    if (typeof body.scope === 'string') updates.scope = body.scope;

    if (typeof body.hierarchy === 'number') {
      if (body.hierarchy >= actorHierarchy && actorHierarchy < 1000) {
        return NextResponse.json({ success: false, error: 'No podés asignar una jerarquía igual o superior a la tuya' }, { status: 403 });
      }
      updates.hierarchy = body.hierarchy;
    }

    if (body.togglePermission) {
      const { key, enabled } = body.togglePermission;
      if (!isValidPermissionKey(key)) return NextResponse.json({ success: false, error: 'Permiso inválido' }, { status: 400 });
      const nextPermissions = enabled ? Array.from(new Set([...role.permissions, key])) : role.permissions.filter((p) => p !== key);
      updates.permissions = nextPermissions;
      logDescription = `${identity.name} ${enabled ? 'activó' : 'desactivó'} el permiso "${key}" en "${role.name}"`;
    }

    await col.updateOne({ id: roleId }, { $set: updates });
    await logStaffAction({ type: 'permission_role_updated', category: 'STAFF', actor: identity.name, actorId: identity.id, target: role.name, description: logDescription });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editando rango:', error);
    return NextResponse.json({ success: false, error: 'No se pudo editar el rango' }, { status: 500 });
  }
}

/** Eliminar un rango. Bloqueado si hay Staff asignado a él. Solo CEO. */
export async function DELETE(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const roleId = request.nextUrl.searchParams.get('roleId');
    if (!roleId) return NextResponse.json({ success: false, error: 'Falta el rango' }, { status: 400 });

    const col = await staffRolesCollection();
    const role = await col.findOne({ id: roleId });
    if (!role) return NextResponse.json({ success: false, error: 'Rango no encontrado' }, { status: 404 });
    if (role.permissions.includes('*')) return NextResponse.json({ success: false, error: 'El rango de control absoluto no puede eliminarse' }, { status: 400 });

    const assignCol = await staffRoleAssignmentsCollection();
    const inUse = await assignCol.countDocuments({ roleId });
    if (inUse > 0) return NextResponse.json({ success: false, error: `Hay ${inUse} miembro(s) de staff con este rango; reasignalos primero` }, { status: 400 });

    const actorHierarchy = await getHierarchy(identity);
    if (!canManageHierarchy(actorHierarchy, role.hierarchy)) {
      return NextResponse.json({ success: false, error: 'No podés eliminar un rango de jerarquía igual o superior a la tuya' }, { status: 403 });
    }

    await col.deleteOne({ id: roleId });
    await logStaffAction({ type: 'permission_role_deleted', category: 'STAFF', actor: identity.name, actorId: identity.id, target: role.name, description: `${identity.name} eliminó el rango "${role.name}"` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando rango:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar el rango' }, { status: 500 });
  }
}

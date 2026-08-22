import { NextResponse } from 'next/server';
import { requireStaff, staffIdentity } from '@/lib/staffServer';
import { ensureRolesSeeded, getAssignedRole, effectivePermissions, isCEOUser, getHierarchy } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/**
 * Rol y permisos efectivos de quien está usando el panel ahora mismo.
 * Solo para que el FRONTEND sepa qué mostrar/ocultar — nunca es la
 * fuente de verdad: cada ruta valida el permiso otra vez en el backend.
 */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    await ensureRolesSeeded();
    const identity = staffIdentity();
    const role = identity ? await getAssignedRole(identity.id) : null;
    const { all, keys } = await effectivePermissions(identity);
    const isCEO = await isCEOUser(identity);
    const hierarchy = await getHierarchy(identity);

    return NextResponse.json({
      success: true,
      role: role ? { id: role.id, name: role.name, category: role.category, hierarchy: role.hierarchy, scope: role.scope, color: role.color } : null,
      isCEO,
      hierarchy,
      permissions: all ? ['*'] : Array.from(keys),
    });
  } catch (error) {
    console.error('Error leyendo permisos propios:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

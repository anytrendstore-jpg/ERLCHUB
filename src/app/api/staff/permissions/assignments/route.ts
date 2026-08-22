import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireStaff, staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requireCEO, staffRoleAssignmentsCollection, staffRolesCollection, getHierarchy, canManageHierarchy } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Quién tiene qué rango. Visible para cualquier Staff. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const col = await staffRoleAssignmentsCollection();
    const assignments = await col.find({}).sort({ assignedAt: -1 }).toArray();
    return NextResponse.json({ success: true, assignments: assignments.map(({ _id, ...a }: any) => a) });
  } catch (error) {
    console.error('Error leyendo asignaciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Asignar un rango a un miembro del staff (por Discord ID). Solo CEO. */
export async function POST(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { discordId, staffName, roleId } = await request.json();
    if (!discordId?.trim() || !staffName?.trim() || !roleId) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const rolesCol = await staffRolesCollection();
    const role = await rolesCol.findOne({ id: roleId });
    if (!role) return NextResponse.json({ success: false, error: 'Rango no encontrado' }, { status: 404 });

    const actorHierarchy = await getHierarchy(identity);
    if (!role.permissions.includes('*') && role.hierarchy >= actorHierarchy && actorHierarchy < 1000) {
      return NextResponse.json({ success: false, error: 'No podés asignar un rango de jerarquía igual o superior a la tuya' }, { status: 403 });
    }
    if (role.permissions.includes('*') && identity.via !== 'password') {
      return NextResponse.json({ success: false, error: 'El rango de control absoluto no se asigna desde aquí' }, { status: 400 });
    }

    const col = await staffRoleAssignmentsCollection();
    const now = new Date();
    const assignment = {
      id: crypto.randomUUID(), discordId: discordId.trim(), staffName: staffName.trim(),
      roleId, roleName: role.name, assignedBy: identity.name, assignedAt: now,
    };
    await col.updateOne({ discordId: discordId.trim() }, { $set: assignment }, { upsert: true });
    await logStaffAction({ type: 'permission_role_assigned', category: 'STAFF', actor: identity.name, actorId: identity.id, target: staffName.trim(), description: `${identity.name} asignó el rango "${role.name}" a ${staffName.trim()}` });
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Error asignando rango:', error);
    return NextResponse.json({ success: false, error: 'No se pudo asignar el rango' }, { status: 500 });
  }
}

/** Quitar el rango asignado a un miembro del staff. Solo CEO. */
export async function DELETE(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const discordId = request.nextUrl.searchParams.get('discordId');
    if (!discordId) return NextResponse.json({ success: false, error: 'Falta el Discord ID' }, { status: 400 });

    const col = await staffRoleAssignmentsCollection();
    const assignment = await col.findOne({ discordId });
    if (!assignment) return NextResponse.json({ success: false, error: 'No tiene rango asignado' }, { status: 404 });

    const rolesCol = await staffRolesCollection();
    const role = await rolesCol.findOne({ id: assignment.roleId });
    const actorHierarchy = await getHierarchy(identity);
    if (role && !canManageHierarchy(actorHierarchy, role.hierarchy)) {
      return NextResponse.json({ success: false, error: 'No podés retirar un rango de jerarquía igual o superior a la tuya' }, { status: 403 });
    }

    await col.deleteOne({ discordId });
    await logStaffAction({ type: 'permission_role_unassigned', category: 'STAFF', actor: identity.name, actorId: identity.id, target: assignment.staffName, description: `${identity.name} retiró el rango "${assignment.roleName}" de ${assignment.staffName}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error retirando rango:', error);
    return NextResponse.json({ success: false, error: 'No se pudo retirar el rango' }, { status: 500 });
  }
}

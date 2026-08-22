import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireStaff, staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requireCEO, staffPermissionExceptionsCollection } from '@/lib/permissions/engine';
import { isValidPermissionKey } from '@/lib/permissions/catalog';

export const dynamic = 'force-dynamic';

/** Permisos individuales otorgados fuera del rango (temporales o no). Visible para cualquier Staff. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const col = await staffPermissionExceptionsCollection();
    const exceptions = await col.find({}).sort({ grantedAt: -1 }).limit(200).toArray();
    return NextResponse.json({ success: true, exceptions: exceptions.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error leyendo excepciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/**
 * Otorgar un permiso puntual a un usuario sin tocar su rango
 * (sección 41 del spec). `expiresInHours` opcional = permiso temporal.
 * Solo CEO.
 */
export async function POST(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { discordId, staffName, permissionKey, reason, expiresInHours } = await request.json();
    if (!discordId?.trim() || !staffName?.trim() || !isValidPermissionKey(permissionKey) || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos o el permiso es inválido' }, { status: 400 });
    }

    const col = await staffPermissionExceptionsCollection();
    const now = new Date();
    const exception = {
      id: crypto.randomUUID(), discordId: discordId.trim(), staffName: staffName.trim(), permissionKey,
      reason: reason.trim(), grantedBy: identity.name, grantedAt: now,
      expiresAt: typeof expiresInHours === 'number' && expiresInHours > 0 ? new Date(now.getTime() + expiresInHours * 3600 * 1000) : undefined,
    };
    await col.insertOne(exception);
    await logStaffAction({
      type: 'permission_exception_granted', category: 'STAFF', actor: identity.name, actorId: identity.id, target: staffName.trim(),
      description: `${identity.name} otorgó el permiso "${permissionKey}" a ${staffName.trim()}${exception.expiresAt ? ` por ${expiresInHours}h` : ' (sin vencimiento)'} — motivo: ${reason.trim()}`,
    });
    return NextResponse.json({ success: true, exception });
  } catch (error) {
    console.error('Error otorgando excepción:', error);
    return NextResponse.json({ success: false, error: 'No se pudo otorgar el permiso' }, { status: 500 });
  }
}

/** Revocar una excepción antes de que expire. Solo CEO. */
export async function DELETE(request: NextRequest) {
  const denied = await requireCEO();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Falta la excepción' }, { status: 400 });

    const col = await staffPermissionExceptionsCollection();
    const exception = await col.findOne({ id });
    if (!exception) return NextResponse.json({ success: false, error: 'Excepción no encontrada' }, { status: 404 });

    await col.updateOne({ id }, { $set: { revokedAt: new Date(), revokedBy: identity.name } });
    await logStaffAction({ type: 'permission_exception_revoked', category: 'STAFF', actor: identity.name, actorId: identity.id, target: exception.staffName, description: `${identity.name} revocó el permiso "${exception.permissionKey}" de ${exception.staffName}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revocando excepción:', error);
    return NextResponse.json({ success: false, error: 'No se pudo revocar el permiso' }, { status: 500 });
  }
}

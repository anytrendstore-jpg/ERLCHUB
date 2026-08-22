import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, staffMembers } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { STAFF_DISCORD_IDS } from '@/lib/whitelistServer';

export const dynamic = 'force-dynamic';

/**
 * Directorio de staff (nombre, rol, nota). Es solo informativo: el acceso real
 * al panel lo sigue dando `STAFF_DISCORD_IDS` en el entorno, no esta lista.
 */
export async function GET() {
  const denied = await requirePermission('staff.view');
  if (denied) return denied;

  try {
    const col = await staffMembers();
    const docs = await col.find({}).sort({ addedAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      members: docs.map(({ _id, ...m }: any) => m),
      configuredIds: STAFF_DISCORD_IDS,
    });
  } catch (error) {
    console.error('Error listando el directorio de staff:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('staff.hr.manage');
  if (denied) return denied;

  try {
    const { discordId, name, role } = await request.json();
    if (!discordId?.trim() || !name?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos del miembro' }, { status: 400 });
    }

    const identity = staffIdentity();
    const col = await staffMembers();
    const doc = {
      id: crypto.randomUUID(),
      discordId: discordId.trim(),
      name: name.trim(),
      role: role?.trim() || 'Staff',
      addedAt: new Date(),
      addedBy: identity?.name || 'Staff',
    };

    await col.updateOne({ discordId: doc.discordId }, { $set: doc }, { upsert: true });
    return NextResponse.json({ success: true, member: doc });
  } catch (error) {
    console.error('Error añadiendo miembro de staff:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requirePermission('staff.hr.manage');
  if (denied) return denied;

  try {
    const { discordId } = await request.json();
    if (!discordId) return NextResponse.json({ success: false, error: 'Falta el id de Discord' }, { status: 400 });

    const col = await staffMembers();
    await col.deleteOne({ discordId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando miembro de staff:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

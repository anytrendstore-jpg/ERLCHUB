import { NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { checkFactionAccess } from '@/lib/factionsServer';
import { DEPARTMENTS } from '@/lib/departments';

export const dynamic = 'force-dynamic';

/**
 * ¿Esta cuenta es miembro activo de algún departamento con terminal propia?
 * La membresía es a nivel cuenta (Discord ID), no por personaje — todavía no
 * existe un vínculo personaje↔facción, así que cualquier personaje de una
 * cuenta miembro cuenta como "institucional" por ahora.
 */
export async function GET() {
  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: true, department: null });

  try {
    for (const department of Object.values(DEPARTMENTS)) {
      const { allowed } = await checkFactionAccess(user.id, department.factionAbbreviation);
      if (allowed) return NextResponse.json({ success: true, department: department.slug });
    }
    return NextResponse.json({ success: true, department: null });
  } catch (error) {
    console.error('Error resolviendo membresía institucional:', error);
    return NextResponse.json({ success: false, error: 'No se pudo verificar la membresía' }, { status: 500 });
  }
}

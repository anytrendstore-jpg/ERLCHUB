import { NextRequest, NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { checkFactionAccess } from '@/lib/factionsServer';
import { getDepartment } from '@/lib/departments';

export const dynamic = 'force-dynamic';

/** ¿Puede este usuario entrar a la terminal institucional de este departamento? */
export async function GET(request: NextRequest, { params }: { params: { dept: string } }) {
  const department = getDepartment(params.dept);
  if (!department) return NextResponse.json({ success: true, allowed: false, reason: 'unknown_department' });

  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: true, allowed: false, reason: 'not_logged_in' });

  try {
    const { allowed, faction, rank } = await checkFactionAccess(user.id, department.factionAbbreviation);
    if (!allowed) {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: faction ? 'not_member' : 'faction_missing',
      });
    }
    return NextResponse.json({ success: true, allowed: true, rankName: rank?.name || null });
  } catch (error) {
    console.error('Error verificando acceso a la terminal institucional:', error);
    return NextResponse.json({ success: false, error: 'No se pudo verificar el acceso' }, { status: 500 });
  }
}

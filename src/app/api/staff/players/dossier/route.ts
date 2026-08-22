import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/engine';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { getPlayerDossier } from '@/lib/playerDossierServer';

export const dynamic = 'force-dynamic';

/** Expediente 360° de un jugador. Consulta sensible: queda auditada como Asuntos Internos. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('players.profile.view');
  if (denied) return denied;

  try {
    const discordId = request.nextUrl.searchParams.get('discordId');
    if (!discordId) return NextResponse.json({ success: false, error: 'Falta el discordId' }, { status: 400 });

    const dossier = await getPlayerDossier(discordId);
    if (!dossier) return NextResponse.json({ success: false, error: 'Jugador no encontrado' }, { status: 404 });

    const identity = staffIdentity();
    await logStaffAction({
      type: 'player_dossier_accessed', category: 'STAFF', actor: identity?.name || 'Staff', actorId: identity?.id,
      target: dossier.identity.displayName, targetId: discordId,
      description: `${identity?.name || 'Staff'} consultó el expediente completo de ${dossier.identity.displayName}`,
    });

    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    console.error('Error generando el expediente del jugador:', error);
    return NextResponse.json({ success: false, error: 'No se pudo generar el expediente' }, { status: 500 });
  }
}

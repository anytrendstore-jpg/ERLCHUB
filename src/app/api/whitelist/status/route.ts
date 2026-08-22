import { NextResponse } from 'next/server';
import {
  applications,
  createSessionToken,
  currentApplication,
  currentDiscordUser,
  isStaffDiscordUser,
  isStaffSession,
  PHASE_ROUTES,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/whitelistServer';

export const dynamic = 'force-dynamic';

/**
 * Estado ligero para la barra de navegación: si quien navega tiene solicitud de
 * whitelist, en qué punto está y si es staff.
 *
 * Si ha iniciado sesión con Discord en el sitio y ya tenía una solicitud, se le
 * devuelve la sesión de whitelist para que continúe por donde la dejó.
 */
export async function GET() {
  try {
    let application = await currentApplication();
    let adopted = false;

    if (!application) {
      const discordUser = currentDiscordUser();
      if (discordUser) {
        const col = await applications();
        application = await col.findOne({ discordId: discordUser.id });
        adopted = Boolean(application);
      }
    }

    const payload = {
      success: true,
      isStaff: isStaffSession() || isStaffDiscordUser(),
      hasApplication: Boolean(application),
      currentPhase: application?.currentPhase ?? null,
      status: application?.status ?? null,
      completed: application?.currentPhase === 'completed',
      nextRoute: application ? PHASE_ROUTES[application.currentPhase] : '/whitelist',
    };

    const response = NextResponse.json(payload);

    if (adopted && application) {
      response.cookies.set(
        SESSION_COOKIE,
        createSessionToken(application.applicationId),
        sessionCookieOptions()
      );
    }

    return response;
  } catch (error) {
    console.error('Error consultando el estado de whitelist:', error);
    // La barra de navegación no debe romperse si la base de datos no responde.
    return NextResponse.json({
      success: false,
      isStaff: false,
      hasApplication: false,
      currentPhase: null,
      status: null,
      completed: false,
      nextRoute: '/whitelist',
    });
  }
}

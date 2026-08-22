import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  createSessionToken,
  devLoginAllowed,
  findOrCreateByDiscord,
  sessionCookieOptions,
  SESSION_COOKIE,
  toPublicApplication,
} from '@/lib/whitelistServer';

export const dynamic = 'force-dynamic';

/**
 * Entrada de PRUEBA para desarrollo local.
 *
 * Solo funciona si NO hay credenciales de Discord configuradas y no estamos en
 * producción. En cuanto se rellenen DISCORD_CLIENT_ID/SECRET, esta ruta deja de
 * responder y el único acceso es el login real de Discord.
 */
export async function POST(request: NextRequest) {
  if (!devLoginAllowed) {
    return NextResponse.json(
      { success: false, error: 'El acceso a la whitelist es únicamente con Discord' },
      { status: 403 }
    );
  }

  try {
    const { username } = await request.json();
    const name = String(username || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Escribe un usuario de Discord' }, { status: 400 });
    }

    // Id estable derivado del nombre: al volver a entrar se recupera la misma solicitud.
    const id = `dev-${crypto.createHash('sha1').update(name.toLowerCase()).digest('hex').slice(0, 16)}`;

    const application = await findOrCreateByDiscord({
      id,
      username: name,
      globalName: name,
      source: 'dev',
    });

    const response = NextResponse.json({
      success: true,
      application: toPublicApplication(application),
    });
    response.cookies.set(SESSION_COOKIE, createSessionToken(application.applicationId), sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Error en la entrada de prueba de whitelist:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo conectar con la base de datos' },
      { status: 500 }
    );
  }
}

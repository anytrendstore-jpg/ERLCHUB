import { NextRequest, NextResponse } from 'next/server';
import { DISCORD_CLIENT_ID, discordConfigured, devLoginAllowed } from '@/lib/whitelistServer';
import { publicOrigin } from '@/lib/requestOrigin';

export const dynamic = 'force-dynamic';

/** Scopes mínimos: identidad + email + saber si ya está en el servidor. */
const SCOPES = 'identify email guilds';

/** Estado del login: lo usa la página de whitelist para saber qué mostrar. */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('check') === '1') {
    return NextResponse.json({
      success: true,
      discordConfigured,
      devLoginAllowed,
    });
  }

  const origin = publicOrigin(request);

  if (!discordConfigured) {
    return NextResponse.redirect(
      new URL('/whitelist?error=discord_no_configurado', origin)
    );
  }

  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', DISCORD_CLIENT_ID);
  url.searchParams.set(
    'redirect_uri',
    process.env.WHITELIST_DISCORD_REDIRECT_URI ||
      `${origin}/api/whitelist/auth/discord/callback`
  );
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(url);
}

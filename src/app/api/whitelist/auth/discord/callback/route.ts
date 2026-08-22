import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  discordConfigured,
  ERLCHUB_GUILD_ID,
  findOrCreateByDiscord,
  PHASE_ROUTES,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/whitelistServer';
import { publicOrigin } from '@/lib/requestOrigin';

export const dynamic = 'force-dynamic';

const fail = (origin: string, reason: string) =>
  NextResponse.redirect(new URL(`/whitelist?error=${reason}`, origin));

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);

  if (!discordConfigured) return fail(origin, 'discord_no_configurado');

  const code = request.nextUrl.searchParams.get('code');
  if (request.nextUrl.searchParams.get('error') || !code) {
    return fail(origin, 'discord_cancelado');
  }

  const redirectUri =
    process.env.WHITELIST_DISCORD_REDIRECT_URI || `${origin}/api/whitelist/auth/discord/callback`;

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Whitelist: fallo al canjear el código de Discord', await tokenResponse.text());
      return fail(origin, 'discord_token');
    }

    const token = await tokenResponse.json();
    const authHeader = { Authorization: `Bearer ${token.access_token}` };

    const userResponse = await fetch('https://discord.com/api/users/@me', { headers: authHeader });
    if (!userResponse.ok) return fail(origin, 'discord_usuario');
    const user = await userResponse.json();

    // Con el scope `guilds` sabemos si ya está en el servidor y damos por
    // cumplido ese requisito automáticamente.
    let inGuild = false;
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', { headers: authHeader });
    if (guildsResponse.ok) {
      const guilds = await guildsResponse.json();
      inGuild = Array.isArray(guilds) && guilds.some((g: { id: string }) => g.id === ERLCHUB_GUILD_ID);
    }

    const application = await findOrCreateByDiscord({
      id: user.id,
      username: user.username,
      globalName: user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : undefined,
      email: user.email,
      inGuild,
      source: 'oauth',
    });

    const response = NextResponse.redirect(
      new URL(PHASE_ROUTES[application.currentPhase], origin)
    );
    response.cookies.set(SESSION_COOKIE, createSessionToken(application.applicationId), sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Whitelist: error en el callback de Discord', error);
    return fail(origin, 'discord_error');
  }
}

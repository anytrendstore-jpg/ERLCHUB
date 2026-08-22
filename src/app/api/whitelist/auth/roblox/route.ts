import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentApplication } from '@/lib/whitelistServer';
import { publicOrigin } from '@/lib/requestOrigin';

export const dynamic = 'force-dynamic';

export const ROBLOX_OAUTH_STATE_COOKIE = 'wl_roblox_oauth_state';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
export const robloxOAuthConfigured = Boolean(ROBLOX_CLIENT_ID && ROBLOX_CLIENT_SECRET);

/**
 * Inicia el login oficial de Roblox (OAuth2) para vincular la cuenta de la
 * solicitud de whitelist activa. Solo pedimos los scopes `openid profile`:
 * identidad, username, nombre para mostrar y foto de perfil — nada de
 * Robux, compras, inventario ni amigos.
 */
export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);

  const application = await currentApplication();
  if (!application) {
    return NextResponse.redirect(new URL('/whitelist/discord', origin));
  }

  if (!robloxOAuthConfigured) {
    return NextResponse.redirect(new URL('/whitelist/roblox?error=oauth_not_configured', origin));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${origin}/api/whitelist/auth/roblox/callback`;

  const authorizeUrl = new URL('https://apis.roblox.com/oauth/v1/authorize');
  authorizeUrl.searchParams.set('client_id', ROBLOX_CLIENT_ID!);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'openid profile');
  authorizeUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(ROBLOX_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}

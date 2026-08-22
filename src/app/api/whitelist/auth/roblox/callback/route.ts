import { NextRequest, NextResponse } from 'next/server';
import { applications, currentApplication } from '@/lib/whitelistServer';
import { publicOrigin } from '@/lib/requestOrigin';
import { ROBLOX_OAUTH_STATE_COOKIE } from '../route';

export const dynamic = 'force-dynamic';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;

const fail = (request: NextRequest, error: string) =>
  NextResponse.redirect(new URL(`/whitelist/roblox?error=${error}`, publicOrigin(request)));

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  const expectedState = request.cookies.get(ROBLOX_OAUTH_STATE_COOKIE)?.value;

  if (oauthError) return fail(request, 'oauth_denied');
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail(request, 'oauth_invalid_state');
  }

  const application = await currentApplication();
  if (!application) return fail(request, 'no_session');

  try {
    const redirectUri = `${origin}/api/whitelist/auth/roblox/callback`;

    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: ROBLOX_CLIENT_ID!,
        client_secret: ROBLOX_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Roblox OAuth token exchange failed:', await tokenResponse.text());
      return fail(request, 'token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Roblox OAuth userinfo failed:', await userResponse.text());
      return fail(request, 'user_info_failed');
    }

    const userData = await userResponse.json();
    const robloxId = String(userData.sub);

    const col = await applications();

    const taken = await col.findOne({
      applicationId: { $ne: application.applicationId },
      'roblox.id': robloxId,
      'roblox.verified': true,
    });
    if (taken) return fail(request, 'roblox_already_linked');

    const now = new Date();
    await col.updateOne(
      { applicationId: application.applicationId },
      {
        $set: {
          roblox: {
            id: robloxId,
            username: userData.preferred_username || robloxId,
            displayName: userData.name || userData.preferred_username || robloxId,
            avatar: userData.picture,
            verificationCode: application.roblox?.verificationCode || '',
            verified: true,
            verifiedMode: 'oauth' as const,
            connectedAt: now,
          },
          updatedAt: now,
          ...(application.currentPhase === 'roblox' ? { currentPhase: 'questionnaire' as const } : {}),
        },
      }
    );

    const response = NextResponse.redirect(new URL('/whitelist/roblox?oauth=success', origin));
    response.cookies.delete(ROBLOX_OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error('Roblox OAuth callback error:', error);
    return fail(request, 'callback_failed');
  }
}

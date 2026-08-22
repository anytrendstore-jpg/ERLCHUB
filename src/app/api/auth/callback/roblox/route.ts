import { NextRequest, NextResponse } from 'next/server';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/roblox';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Roblox OAuth error:', error);
    return NextResponse.redirect(new URL('/ingresar?error=roblox_auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/ingresar?error=no_code', request.url));
  }

  try {
    const tokenResponse = await fetch('https://www.roblox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: ROBLOX_CLIENT_ID!,
        client_secret: ROBLOX_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/ingresar?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://www.roblox.com/oauth2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('User info fetch failed:', errorData);
      return NextResponse.redirect(new URL('/ingresar?error=user_info_failed', request.url));
    }

    const userData = await userResponse.json();

    const sessionData = {
      user: {
        id: userData.sub,
        username: userData.preferred_username,
        displayName: userData.name,
        avatar: userData.picture,
        email: userData.email,
        platform: 'roblox',
      },
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    };

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    response.cookies.set('roblox_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 604800,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Roblox OAuth callback error:', error);
    return NextResponse.redirect(new URL('/ingresar?error=callback_failed', request.url));
  }
}
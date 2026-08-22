import { NextRequest, NextResponse } from 'next/server';
import { publicOrigin } from '@/lib/requestOrigin';

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1433560156909863084';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);
  const REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${origin}/api/auth/callback/discord`;

  console.log('=== Discord Callback Iniciado ===');

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('Parámetros recibidos:', { code: code ? code.substring(0, 20) + '...' : 'null', error });

  if (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(new URL('/ingresar?error=discord_auth_failed', origin));
  }

  if (!code) {
    console.error('No code provided');
    return NextResponse.redirect(new URL('/ingresar?error=no_code', origin));
  }

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/ingresar?error=token_exchange_failed', origin));
    }

    const tokenData = await tokenResponse.json();
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });


    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('User info fetch failed:', errorData);
      return NextResponse.redirect(new URL('/ingresar?error=user_info_failed', origin));
    }
    const userData = await userResponse.json();
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    let guilds = [];
    if (guildsResponse.ok) {
      guilds = await guildsResponse.json();
    } else {
      console.error('Failed to fetch guilds');
    }

    const sessionData = {
      user: {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar,
        global_name: userData.global_name,
      },
      guilds: guilds.slice(0, 5).map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon
      })),
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    };

    const sessionDataString = JSON.stringify(sessionData);

    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Autenticando...</title>
        <meta charset="UTF-8">
    </head>
    <body>
        <script>
            const sessionData = ${sessionDataString};

            fetch('/api/auth/set-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionData })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Sesión establecida:', data);
                if (data.success) {
                    window.location.href = '/ingresar?session=started';
                } else {
                    window.location.href = '/ingresar?error=set_session_failed';
                }
            })
            .catch(error => {
                console.error('Error estableciendo sesión:', error);
                window.location.href = '/ingresar?error=callback_failed';
            });
        </script>
    </body>
    </html>
    `;

    console.log('=== Discord Callback Exitoso (con HTML response) ===');
    return new NextResponse(htmlResponse, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error en Discord callback:', error);
    return NextResponse.redirect(new URL('/ingresar?error=callback_error', origin));
  }
}

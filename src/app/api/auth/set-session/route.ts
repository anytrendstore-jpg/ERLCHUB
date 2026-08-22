import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== Set Session Endpoint ===');
    console.log('Body recibido:', body);
    console.log('Body type:', typeof body);
    
    const { sessionData } = body;
    
    if (!sessionData) {
      console.error('No se recibió sessionData en el body');
      return NextResponse.json({ success: false, error: 'No session data received' }, { status: 400 });
    }
    
    console.log('Session data recibida:', {
      hasUser: !!sessionData.user,
      hasAccessToken: !!sessionData.accessToken,
      username: sessionData.user?.username
    });
    
    const response = NextResponse.json({ success: true });
    
    const cookieValue = `discord_session=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/; SameSite=lax; Max-Age=${sessionData.expiresIn || 604800}`;
    
    response.headers.set('Set-Cookie', cookieValue);
    
    return response;
  } catch (error) {
    console.error('Error en set session:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
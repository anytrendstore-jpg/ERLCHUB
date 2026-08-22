import { NextResponse } from 'next/server';
import { currentChatUser, ensurePhoneNumber } from '@/lib/chatServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const phoneNumber = await ensurePhoneNumber(me.id);
    return NextResponse.json({ success: true, profile: { ...me, phoneNumber } });
  } catch (error) {
    console.error('Error leyendo perfil de HubChat:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

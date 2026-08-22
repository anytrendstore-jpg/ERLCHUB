import { NextRequest, NextResponse } from 'next/server';
import { currentChatUser, chatPhoneNumbersCollection } from '@/lib/chatServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Busca contactos por username/nombre de personaje o por número de teléfono. */
export async function GET(request: NextRequest) {
  const me = await currentChatUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ success: true, users: [] });

    const profilesCol = await socialProfilesCollection();

    const isPhoneLike = /^[\d-]+$/.test(q);
    if (isPhoneLike) {
      const phoneCol = await chatPhoneNumbersCollection();
      const match = await phoneCol.findOne({ phoneNumber: { $regex: q, $options: 'i' } });
      if (!match || match.discordId === me.id) return NextResponse.json({ success: true, users: [] });
      const profile = await profilesCol.findOne({ discordId: match.discordId });
      if (!profile) return NextResponse.json({ success: true, users: [] });
      return NextResponse.json({
        success: true,
        users: [{ discordId: profile.discordId, username: profile.username, displayName: profile.displayName || profile.username, avatar: profile.avatarUrl || profile.avatar, phoneNumber: match.phoneNumber }],
      });
    }

    const docs = await profilesCol
      .find({ $or: [{ username: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }], discordId: { $ne: me.id } })
      .limit(20)
      .toArray();

    return NextResponse.json({
      success: true,
      users: docs.map((d) => ({ discordId: d.discordId, username: d.username, displayName: d.displayName || d.username, avatar: d.avatarUrl || d.avatar })),
    });
  } catch (error) {
    console.error('Error buscando contactos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo buscar' }, { status: 500 });
  }
}

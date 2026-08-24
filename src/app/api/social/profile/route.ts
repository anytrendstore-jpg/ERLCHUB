import { NextRequest, NextResponse } from 'next/server';
import {
  socialProfilesCollection,
  socialFollowsCollection,
  socialPostsCollection,
  socialProfileStats,
  currentSocialUser,
  touchSocialProfile,
} from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const targetId = request.nextUrl.searchParams.get('discordId') || me.id;

    const profilesCol = await socialProfilesCollection();
    let profile = await profilesCol.findOne({ discordId: targetId });

    if (!profile && targetId === me.id) {
      await touchSocialProfile(me);
      profile = await profilesCol.findOne({ discordId: targetId });
    }
    if (!profile) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    const [stats, followsCol] = await Promise.all([socialProfileStats(targetId), socialFollowsCollection()]);
    const isFollowing = targetId === me.id
      ? false
      : Boolean(await followsCol.findOne({ followerId: me.id, followingId: targetId }));

    const { _id, ...cleanProfile } = profile as any;
    return NextResponse.json({
      success: true,
      profile: cleanProfile,
      stats,
      isFollowing,
      isSelf: targetId === me.id,
    });
  } catch (error) {
    console.error('Error leyendo perfil social:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { bio, avatarUrl, coverUrl, website } = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof bio === 'string') update.bio = bio.trim().slice(0, 160);
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl.trim().slice(0, 1000) || undefined;
    if (typeof coverUrl === 'string') update.coverUrl = coverUrl.trim().slice(0, 1000) || undefined;
    if (typeof website === 'string') update.website = website.trim().slice(0, 200) || undefined;

    const col = await socialProfilesCollection();
    await col.updateOne(
      { discordId: me.id },
      { $set: { discordId: me.id, username: me.username, displayName: me.displayName, avatar: me.avatar, ...update } },
      { upsert: true }
    );

    // Propagar el nuevo avatar/nombre a publicaciones ya existentes (para que el feed se vea consistente).
    if (typeof avatarUrl === 'string') {
      const postsCol = await socialPostsCollection();
      await postsCol.updateMany({ discordId: me.id }, { $set: { avatar: update.avatarUrl || me.avatar } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando perfil social:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}

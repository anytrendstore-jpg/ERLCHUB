import { NextRequest, NextResponse } from 'next/server';
import { socialFollowsCollection, socialProfilesCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Lista de seguidores o seguidos de un usuario, con perfiles resueltos y el estado de seguimiento del viewer. */
export async function GET(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const discordId = request.nextUrl.searchParams.get('discordId');
  const type = request.nextUrl.searchParams.get('type');
  if (!discordId || (type !== 'followers' && type !== 'following')) {
    return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
  }

  try {
    const followsCol = await socialFollowsCollection();
    const query = type === 'followers' ? { followingId: discordId } : { followerId: discordId };
    const edges = await followsCol.find(query).sort({ createdAt: -1 }).toArray();
    const ids = edges.map((e) => (type === 'followers' ? e.followerId : e.followingId));

    if (ids.length === 0) return NextResponse.json({ success: true, people: [] });

    const profilesCol = await socialProfilesCollection();
    const profiles = await profilesCol.find({ discordId: { $in: ids } }).toArray();
    const byId = new Map(profiles.map((p) => [p.discordId, p]));

    const myFollowing = new Set(
      (await followsCol.find({ followerId: me.id, followingId: { $in: ids } }).toArray()).map((e) => e.followingId)
    );

    const people = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        discordId: p.discordId,
        username: p.username,
        displayName: p.displayName,
        avatar: p.avatarUrl || p.avatar,
        verified: p.verified,
        accountType: p.accountType,
        isFollowing: myFollowing.has(p.discordId),
        isSelf: p.discordId === me.id,
      }));

    return NextResponse.json({ success: true, people });
  } catch (error) {
    console.error('Error listando seguidores/seguidos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo cargar la lista' }, { status: 500 });
  }
}

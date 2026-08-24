import { NextResponse } from 'next/server';
import { socialFollowsCollection, socialProfilesCollection, socialPagesCollection, socialGroupsCollection, socialGroupMembersCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const SUGGESTIONS_LIMIT = 5;

/**
 * "Personas que quizás conozcas" + páginas/grupos/eventos sugeridos para el panel
 * derecho de HubSocial. Eventos todavía no existe como entidad (llega en una fase
 * posterior del rediseño) — se devuelve vacío a propósito en vez de inventar filas,
 * y el cliente muestra un estado vacío honesto para ese.
 */
export async function GET() {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const followsCol = await socialFollowsCollection();
    const profilesCol = await socialProfilesCollection();

    const myFollows = await followsCol.find({ followerId: me.id }).toArray();
    const myFollowingIds = myFollows.map((f) => f.followingId);
    const excludeIds = Array.from(new Set([me.id, ...myFollowingIds]));

    // Amigos en común: gente que las personas que ya sigo, también siguen.
    const mutualCandidates = myFollowingIds.length > 0
      ? await followsCol.aggregate<{ _id: string; mutualCount: number }>([
          { $match: { followerId: { $in: myFollowingIds }, followingId: { $nin: excludeIds } } },
          { $group: { _id: '$followingId', mutualCount: { $sum: 1 } } },
          { $sort: { mutualCount: -1 } },
          { $limit: SUGGESTIONS_LIMIT },
        ]).toArray()
      : [];

    const mutualById = new Map(mutualCandidates.map((c) => [c._id, c.mutualCount]));
    let peopleIds = mutualCandidates.map((c) => c._id);

    if (peopleIds.length < SUGGESTIONS_LIMIT) {
      const alreadyPicked = new Set([...excludeIds, ...peopleIds]);
      const backfill = await profilesCol
        .find({ discordId: { $nin: Array.from(alreadyPicked) } })
        .sort({ updatedAt: -1 })
        .limit(SUGGESTIONS_LIMIT - peopleIds.length)
        .toArray();
      peopleIds = [...peopleIds, ...backfill.map((p) => p.discordId)];
    }

    const peopleProfiles = peopleIds.length > 0
      ? await profilesCol.find({ discordId: { $in: peopleIds } }).toArray()
      : [];
    const profileById = new Map(peopleProfiles.map((p) => [p.discordId, p]));

    const people = peopleIds
      .map((id) => {
        const p = profileById.get(id);
        if (!p) return null;
        return {
          discordId: p.discordId,
          username: p.username,
          displayName: p.displayName,
          avatar: p.avatarUrl || p.avatar,
          mutualCount: mutualById.get(id) || 0,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Páginas más seguidas que el jugador todavía no sigue — reales desde el día uno.
    const pagesCol = await socialPagesCollection();
    const pageDocs = await pagesCol.find({ followers: { $ne: me.id } }).toArray();
    const pages = pageDocs
      .map((p) => ({ id: p.id, name: p.name, category: p.category, avatarUrl: p.avatarUrl, verified: p.verified, verificationType: p.verificationType, followersCount: p.followers.length }))
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, SUGGESTIONS_LIMIT);

    // Grupos con más miembros de los que el jugador todavía no forma parte — reales desde el día uno.
    const groupsCol = await socialGroupsCollection();
    const groupMembersCol = await socialGroupMembersCollection();
    const myGroupMemberships = await groupMembersCol.find({ discordId: me.id }).toArray();
    const myGroupIds = myGroupMemberships.map((m) => m.groupId);
    const groupDocs = await groupsCol.find(myGroupIds.length > 0 ? { id: { $nin: myGroupIds } } : {}).toArray();
    const groupMemberCounts = groupDocs.length > 0
      ? await groupMembersCol.aggregate<{ _id: string; count: number }>([
          { $match: { groupId: { $in: groupDocs.map((g) => g.id) }, status: 'active' } },
          { $group: { _id: '$groupId', count: { $sum: 1 } } },
        ]).toArray()
      : [];
    const groupMemberCountById = new Map(groupMemberCounts.map((c) => [c._id, c.count]));
    const groups = groupDocs
      .filter((g) => g.privacy === 'public')
      .map((g) => ({ id: g.id, name: g.name, category: g.category, icon: g.icon, privacy: g.privacy, memberCount: groupMemberCountById.get(g.id) || 0 }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, SUGGESTIONS_LIMIT);

    return NextResponse.json({ success: true, people, pages, groups, events: [] });
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

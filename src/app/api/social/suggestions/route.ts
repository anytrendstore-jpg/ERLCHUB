import { NextResponse } from 'next/server';
import { socialFollowsCollection, socialProfilesCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const SUGGESTIONS_LIMIT = 5;

/**
 * "Personas que quizás conozcas" + páginas/grupos/eventos sugeridos para el panel
 * derecho de HubSocial. Páginas/grupos/eventos todavía no existen como entidades
 * (llegan en fases posteriores del rediseño) — se devuelven vacíos a propósito en
 * vez de inventar filas, y el cliente muestra un estado vacío honesto para esos.
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

    return NextResponse.json({ success: true, people, pages: [], groups: [], events: [] });
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

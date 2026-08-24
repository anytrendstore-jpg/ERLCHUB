import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialPostsCollection, socialProfilesCollection, socialPagesCollection, currentSocialUser, touchSocialProfile, isSocialSuspended, isOverPostRateLimit, resolveMentions, socialFollowsCollection, isPageAdmin } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Dueño real del post, o admin de la página si se publicó como una página. */
async function canManagePost(post: { discordId: string; authorPageId?: string }, discordId: string): Promise<boolean> {
  if (!post.authorPageId) return post.discordId === discordId;
  const pagesCol = await socialPagesCollection();
  const page = await pagesCol.findOne({ id: post.authorPageId });
  return Boolean(page && isPageAdmin(page, discordId));
}

export async function GET(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const discordId = request.nextUrl.searchParams.get('discordId');
    const pageId = request.nextUrl.searchParams.get('pageId');
    const savedOnly = request.nextUrl.searchParams.get('saved') === '1';
    const followingOnly = request.nextUrl.searchParams.get('feed') === 'following';

    const filter: Record<string, unknown> = { removedByStaff: { $ne: true } };
    if (discordId) filter.discordId = discordId;
    if (pageId) filter.authorPageId = pageId;
    if (savedOnly) filter.savedBy = user.id;
    if (followingOnly) {
      const followsCol = await socialFollowsCollection();
      const follows = await followsCol.find({ followerId: user.id }).toArray();
      const followingIds = follows.map((f) => f.followingId);
      filter.discordId = { $in: [...followingIds, user.id] };
    }

    const col = await socialPostsCollection();
    const docs = await col.find(filter).sort({ featured: -1, createdAt: -1 }).limit(50).toArray();

    const authorIds = Array.from(new Set(docs.map((d) => d.discordId)));
    const profilesCol = await socialProfilesCollection();
    const profiles = await profilesCol.find({ discordId: { $in: authorIds } }).toArray();
    const badgeById = new Map(profiles.map((p) => [p.discordId, { verified: Boolean(p.verified), accountType: p.accountType }]));

    const pageIds = Array.from(new Set(docs.map((d) => d.authorPageId).filter((id): id is string => Boolean(id))));
    const pageBadgeById = new Map<string, { verified: boolean; accountType: string }>();
    if (pageIds.length > 0) {
      const pagesCol = await socialPagesCollection();
      const pages = await pagesCol.find({ id: { $in: pageIds } }).toArray();
      pages.forEach((pg) => pageBadgeById.set(pg.id, { verified: pg.verified, accountType: pg.verificationType || 'business' }));
    }

    const posts = docs.map(({ _id, ...p }: any) => ({
      ...p,
      likes: p.likes || [],
      reactions: p.reactions || [],
      comments: p.comments || [],
      shares: p.shares || [],
      savedBy: p.savedBy || [],
      viewedBy: p.viewedBy || [],
      ...(p.authorPageId ? (pageBadgeById.get(p.authorPageId) || {}) : (badgeById.get(p.discordId) || {})),
    }));
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Error listando publicaciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    if (await isSocialSuspended(user.id)) {
      return NextResponse.json({ success: false, error: 'Tu cuenta de HubSocial está suspendida por staff' }, { status: 403 });
    }
    if (await isOverPostRateLimit(user.id)) {
      return NextResponse.json({ success: false, error: 'Has alcanzado el límite de publicaciones por hora. Intenta más tarde.' }, { status: 429 });
    }

    const { text, imageUrl, pageId } = await request.json();
    const trimmed = String(text || '').trim().slice(0, 500);
    if (!trimmed && !imageUrl) {
      return NextResponse.json({ success: false, error: 'Escribe algo o agrega una imagen' }, { status: 400 });
    }

    let authorIdentity = { username: user.username, displayName: user.displayName, avatar: user.avatar };
    let authorPageId: string | undefined;
    if (pageId) {
      const pagesCol = await socialPagesCollection();
      const page = await pagesCol.findOne({ id: pageId });
      if (!page) return NextResponse.json({ success: false, error: 'La página no existe' }, { status: 404 });
      if (!isPageAdmin(page, user.id)) {
        return NextResponse.json({ success: false, error: 'Solo el dueño o administradores pueden publicar como esta página' }, { status: 403 });
      }
      authorIdentity = { username: page.name, displayName: page.name, avatar: page.avatarUrl };
      authorPageId = page.id;
    }

    const col = await socialPostsCollection();
    const doc = {
      id: crypto.randomUUID(),
      discordId: user.id,
      ...authorIdentity,
      ...(authorPageId ? { authorPageId } : {}),
      text: trimmed,
      imageUrl: imageUrl ? String(imageUrl).trim().slice(0, 1000) : undefined,
      likes: [],
      reactions: [],
      comments: [],
      shares: [],
      savedBy: [],
      viewedBy: [],
      createdAt: new Date(),
    };
    await col.insertOne(doc);
    await touchSocialProfile(user);

    const mentioned = await resolveMentions(trimmed, user.id);
    await Promise.all(mentioned.map((m) => notifyUser(m.discordId, {
      title: 'Te mencionaron',
      message: `${user.displayName} te mencionó en una publicación`,
      type: 'info',
      appId: 'hubsocial',
    })));

    return NextResponse.json({ success: true, post: doc });
  } catch (error) {
    console.error('Error creando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar' }, { status: 500 });
  }
}

/** Editar el texto de una publicación propia. */
export async function PATCH(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId, text } = await request.json();
    const trimmed = String(text || '').trim().slice(0, 500);
    if (!postId || !trimmed) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });
    if (!(await canManagePost(existing, user.id))) {
      return NextResponse.json({ success: false, error: 'Solo puedes editar tus propias publicaciones' }, { status: 403 });
    }

    await col.updateOne({ id: postId }, { $set: { text: trimmed, editedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo editar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await socialPostsCollection();
    const existing = await col.findOne({ id: postId });
    if (!existing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });
    if (!(await canManagePost(existing, user.id))) {
      return NextResponse.json({ success: false, error: 'Solo puedes borrar tus propias publicaciones' }, { status: 403 });
    }

    await col.deleteOne({ id: postId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

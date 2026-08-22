import { NextRequest, NextResponse } from 'next/server';
import { socialProfilesCollection, socialPostsCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const includePosts = request.nextUrl.searchParams.get('posts') === '1';
    if (!q) return NextResponse.json({ success: true, users: [], posts: [] });

    const col = await socialProfilesCollection();
    const docs = await col
      .find({ $or: [{ username: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }] })
      .limit(20)
      .toArray();

    const users = docs.map((d) => ({
      discordId: d.discordId,
      username: d.username,
      displayName: d.displayName || d.username,
      avatar: d.avatarUrl || d.avatar,
    }));

    if (!includePosts) return NextResponse.json({ success: true, users });

    const postsCol = await socialPostsCollection();
    const postDocs = await postsCol
      .find({ text: { $regex: q, $options: 'i' }, removedByStaff: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    const posts = postDocs.map(({ _id, ...p }: any) => p);

    return NextResponse.json({ success: true, users, posts });
  } catch (error) {
    console.error('Error buscando:', error);
    return NextResponse.json({ success: false, error: 'No se pudo buscar' }, { status: 500 });
  }
}

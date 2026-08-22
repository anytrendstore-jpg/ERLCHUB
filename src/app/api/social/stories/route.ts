import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialStoriesCollection, currentSocialUser, touchSocialProfile, STORY_LIFETIME_MS } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await socialStoriesCollection();
    const docs = await col.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).toArray();

    const byUser = new Map<string, typeof docs>();
    for (const s of docs) {
      const arr = byUser.get(s.discordId) || [];
      arr.push(s);
      byUser.set(s.discordId, arr);
    }

    const groups = Array.from(byUser.entries()).map(([discordId, stories]) => ({
      discordId,
      username: stories[0].username,
      displayName: stories[0].displayName,
      avatar: stories[0].avatar,
      hasUnseen: stories.some((s) => !s.viewedBy.includes(me.id)),
      stories: stories.reverse().map(({ _id, ...s }: any) => s),
    }));

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error('Error listando historias:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentSocialUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { type, content, backgroundColor } = await request.json();
    const trimmed = String(content || '').trim();
    if (!trimmed || (type !== 'image' && type !== 'text')) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      discordId: me.id,
      username: me.username,
      displayName: me.displayName,
      avatar: me.avatar,
      type,
      content: trimmed.slice(0, type === 'text' ? 200 : 1000),
      backgroundColor: backgroundColor || '#7c3aed',
      viewedBy: [],
      createdAt: now,
      expiresAt: new Date(now.getTime() + STORY_LIFETIME_MS),
    };

    const col = await socialStoriesCollection();
    await col.insertOne(doc);
    await touchSocialProfile(me);

    return NextResponse.json({ success: true, story: doc });
  } catch (error) {
    console.error('Error publicando historia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar' }, { status: 500 });
  }
}

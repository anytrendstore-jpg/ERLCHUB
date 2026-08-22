import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentBrowserUserId, browserBookmarksCollection } from '@/lib/browserServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const discordId = currentBrowserUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const col = await browserBookmarksCollection();
  const docs = await col.find({ discordId }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ success: true, bookmarks: docs.map(({ _id, ...b }: any) => b) });
}

export async function POST(request: NextRequest) {
  const discordId = currentBrowserUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const { url, title } = await request.json();
  if (!url) return NextResponse.json({ success: false, error: 'Falta la URL' }, { status: 400 });

  const col = await browserBookmarksCollection();
  const existing = await col.findOne({ discordId, url });
  if (existing) {
    await col.deleteOne({ discordId, url });
    return NextResponse.json({ success: true, bookmarked: false });
  }
  await col.insertOne({ id: crypto.randomUUID(), discordId, url, title: title || url, createdAt: new Date() });
  return NextResponse.json({ success: true, bookmarked: true });
}

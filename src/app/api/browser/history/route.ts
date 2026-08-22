import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentBrowserUserId, browserHistoryCollection } from '@/lib/browserServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const discordId = currentBrowserUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const col = await browserHistoryCollection();
  const docs = await col.find({ discordId }).sort({ visitedAt: -1 }).limit(50).toArray();
  return NextResponse.json({ success: true, history: docs.map(({ _id, ...h }: any) => h) });
}

export async function POST(request: NextRequest) {
  const discordId = currentBrowserUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const { url, title } = await request.json();
  if (!url) return NextResponse.json({ success: false, error: 'Falta la URL' }, { status: 400 });

  const col = await browserHistoryCollection();
  await col.insertOne({ id: crypto.randomUUID(), discordId, url, title: title || url, visitedAt: new Date() });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const discordId = currentBrowserUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const col = await browserHistoryCollection();
  await col.deleteMany({ discordId });
  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { economyItems } from '@/lib/staffServer';
import { currentBrowserUserId } from '@/lib/browserServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!currentBrowserUserId()) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const col = await economyItems();
  const docs = await col.find({ module: 'companies', active: true }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({
    success: true,
    companies: docs.map((d) => ({ id: d.id, name: d.name, fields: d.fields })),
  });
}

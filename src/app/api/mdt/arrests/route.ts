import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtArrestsCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtArrestsCollection();
    const docs = await col.find({}).sort({ arrestedAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, arrests: docs.map(({ _id, ...a }: any) => a) });
  } catch (error) {
    console.error('Error listando arrestos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtArrestsCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      arrestNumber: `ARR-${1000 + count + 1}`,
      caseNumber: `CASE-${1000 + count + 1}`,
      arrestedAt: now,
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, arrest: doc });
  } catch (error) {
    console.error('Error creando arresto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

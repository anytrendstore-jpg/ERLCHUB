import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtAuditCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtAuditCollection();
    const docs = await col.find({}).sort({ timestamp: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, logs: docs.map(({ _id, ...l }: any) => l) });
  } catch (error) {
    console.error('Error listando auditoría:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtAuditCollection();
    const doc = { ...body, id: crypto.randomUUID(), timestamp: new Date() };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, log: doc });
  } catch (error) {
    console.error('Error registrando auditoría:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar' }, { status: 500 });
  }
}

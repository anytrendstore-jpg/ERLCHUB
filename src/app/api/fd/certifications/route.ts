import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdCertificationsCollection } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Administración/Comando — solo instructores/mando emiten certificaciones. */
const COMMAND_LEVEL = 4;

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user, rankLevel: access.rank?.level ?? 0 };
}

/** Vencimiento real: si expiresAt ya pasó y sigue marcada Active, se corrige a Expired al leer — nunca se muestra una certificación vencida como vigente. */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdCertificationsCollection();
    const now = new Date();
    await col.updateMany({ status: 'Active', expiresAt: { $lt: now } }, { $set: { status: 'Expired' } });
    const docs = await col.find({}).sort({ issuedAt: -1 }).toArray();
    return NextResponse.json({ success: true, certifications: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando certificaciones de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para emitir certificaciones` }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.firefighterId || !body.firefighterName || !body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdCertificationsCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      firefighterId: body.firefighterId,
      firefighterName: body.firefighterName,
      name: String(body.name).trim().slice(0, 100),
      issuedAt: now,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      instructor: user.displayName,
      status: 'Active' as const,
      createdAt: now,
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, certification: doc });
  } catch (error) {
    console.error('Error emitiendo certificación de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo emitir' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para revocar certificaciones` }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdCertificationsCollection();
    await col.updateOne({ id }, { $set: { status: 'Revoked' } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revocando certificación de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

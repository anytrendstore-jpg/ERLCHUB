import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdPromotionsCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Comando/Academia — decidir un ascenso es una acción de mando. */
const COMMAND_LEVEL = 4;

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user, rankLevel: access.rank?.level ?? 0 };
}

/** Historial de ascensos — público dentro del departamento (real historial, no sensible como Sanciones). */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdPromotionsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, promotions: docs.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando ascensos de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Solo mando registra un ascenso — ya se decidió fuera del sistema, esto es el registro oficial. */
export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para registrar un ascenso` }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.firefighterId || !body.firefighterName || !body.fromRank?.trim() || !body.toRank?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdPromotionsCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      firefighterId: body.firefighterId,
      firefighterName: body.firefighterName,
      fromRank: String(body.fromRank).trim().slice(0, 50),
      toRank: String(body.toRank).trim().slice(0, 50),
      reason: body.reason ? String(body.reason).trim().slice(0, 500) : '',
      status: 'Approved' as const,
      requestedById: user.id,
      requestedByName: user.displayName,
      decidedById: user.id,
      decidedByName: user.displayName,
      createdAt: now,
      decidedAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'record_promotion', description: `Ascenso registrado: ${doc.firefighterName} — ${doc.fromRank} → ${doc.toRank}` });
    return NextResponse.json({ success: true, promotion: doc });
  } catch (error) {
    console.error('Error registrando ascenso de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

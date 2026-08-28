import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdSanctionsCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo umbral que Auditoría — expediente disciplinario, sensible: solo mando lo ve y lo emite. */
const COMMAND_LEVEL = 4;

async function requireCommand() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  if ((access.rank?.level ?? 0) < COMMAND_LEVEL) {
    return { error: NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para ver el expediente disciplinario` }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const ctx = await requireCommand();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdSanctionsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, sanctions: docs.map(({ _id, ...s }: any) => s) });
  } catch (error) {
    console.error('Error listando sanciones de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireCommand();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const body = await request.json();
    if (!body.firefighterId || !body.firefighterName || !body.reason?.trim() || !body.severity) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdSanctionsCollection();
    const doc = {
      id: crypto.randomUUID(),
      firefighterId: body.firefighterId,
      firefighterName: body.firefighterName,
      reason: String(body.reason).trim().slice(0, 500),
      severity: body.severity,
      issuedById: user.id,
      issuedByName: user.displayName,
      createdAt: new Date(),
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'issue_sanction', description: `Sanción emitida: ${doc.firefighterName} — ${doc.severity}` });
    return NextResponse.json({ success: true, sanction: doc });
  } catch (error) {
    console.error('Error emitiendo sanción de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

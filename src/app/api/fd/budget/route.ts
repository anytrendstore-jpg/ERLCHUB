import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdBudgetCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Administración/Academia — movimientos de presupuesto son una acción administrativa, no operativa. */
const COMMAND_LEVEL = 4;

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user, rankLevel: access.rank?.level ?? 0 };
}

/** Cualquier miembro puede ver el libro de movimientos; solo mando (nivel 4+) registra asignaciones/gastos. */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdBudgetCollection();
    const docs = await col.find({}).sort({ date: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, entries: docs.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error listando presupuesto de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user, rankLevel } = ctx;

  if (rankLevel < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para registrar movimientos` }, { status: 403 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);
    if (!body.description?.trim() || !Number.isFinite(amount) || amount <= 0 || !['Allocation', 'Expense'].includes(body.type)) {
      return NextResponse.json({ success: false, error: 'Faltan datos válidos' }, { status: 400 });
    }

    const col = await fdBudgetCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      type: body.type,
      amount,
      description: String(body.description).trim().slice(0, 200),
      category: body.category ? String(body.category).trim().slice(0, 50) : undefined,
      recordedById: user.id,
      recordedByName: user.displayName,
      date: now,
      createdAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'record_budget_entry', description: `${doc.type === 'Allocation' ? 'Asignación' : 'Gasto'} registrado: $${doc.amount} — ${doc.description}` });
    return NextResponse.json({ success: true, entry: doc });
  } catch (error) {
    console.error('Error registrando movimiento de presupuesto de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

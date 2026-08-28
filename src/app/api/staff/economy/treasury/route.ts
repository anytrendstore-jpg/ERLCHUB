import { NextRequest, NextResponse } from 'next/server';
import { getTreasuryBalance, adjustTreasury, treasuryLedgerCollection } from '@/lib/treasuryServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Balance del Tesoro de Gobierno + últimos movimientos del ledger. */
export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const [balance, ledgerCol] = await Promise.all([getTreasuryBalance(), treasuryLedgerCollection()]);
    const ledger = await ledgerCol.find({}).sort({ timestamp: -1 }).limit(100).toArray();
    return NextResponse.json({ success: true, balance, ledger: ledger.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error leyendo el Tesoro de Gobierno:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Ajuste manual del Tesoro (positivo o negativo) — para correcciones/ingresos que todavía no se calculan automáticamente. */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { delta, description } = await request.json();
    const amount = Number(delta);
    if (!Number.isFinite(amount) || amount === 0 || !description?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos válidos' }, { status: 400 });
    }

    const identity = staffIdentity();
    const entry = await adjustTreasury({
      delta: amount, type: 'manual_adjustment', description: description.trim(),
      actorId: identity?.id, actorName: identity?.name || 'Director',
    });

    await logStaffAction({
      type: 'treasury_adjusted',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      description: `${identity?.name || 'Director'} ajustó el Tesoro en ${amount >= 0 ? '+' : ''}$${amount} — ${description.trim()}`,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error ajustando el Tesoro de Gobierno:', error);
    return NextResponse.json({ success: false, error: 'No se pudo ajustar' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { distributeTreasuryFunds } from '@/lib/treasuryServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Distribución manual del Tesoro a los presupuestos departamentales según las tasas configuradas (el ciclo automático es una fase posterior). */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { amount } = await request.json().catch(() => ({}));
    const parsedAmount = amount != null ? Number(amount) : undefined;
    if (parsedAmount != null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      return NextResponse.json({ success: false, error: 'Monto no válido' }, { status: 400 });
    }

    const identity = staffIdentity();
    const result = await distributeTreasuryFunds({
      amount: parsedAmount,
      actorId: identity?.id || 'staff',
      actorName: identity?.name || 'Director',
    });

    await logStaffAction({
      type: 'treasury_distributed',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      description: `${identity?.name || 'Director'} distribuyó $${result.totalDistributed} del Tesoro entre ${result.perDepartment.length} departamento(s)`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error distribuyendo el Tesoro de Gobierno:', error);
    return NextResponse.json({ success: false, error: 'No se pudo distribuir' }, { status: 500 });
  }
}

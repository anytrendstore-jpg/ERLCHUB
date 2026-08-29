import { NextRequest, NextResponse } from 'next/server';
import { listAllLoans, getLoanConfig, updateLoanConfig, releaseGarnishment } from '@/lib/loansServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const status = request.nextUrl.searchParams.get('status') as 'active' | 'paid' | 'defaulted' | null;
    const [loans, config] = await Promise.all([
      listAllLoans(status || undefined),
      getLoanConfig(),
    ]);
    return NextResponse.json({ success: true, loans, config });
  } catch (error) {
    console.error('Error listando préstamos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'update_config' | 'release_garnishment' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const body = await request.json();
    const identity = staffIdentity();

    if (body.action === 'release_garnishment') {
      const { discordId } = body;
      if (!discordId) return NextResponse.json({ success: false, error: 'Falta discordId' }, { status: 400 });
      await releaseGarnishment(discordId, identity?.name || 'Staff');
      await logStaffAction({
        type: 'loan_garnishment_released', category: 'ECONOMIA',
        actor: identity?.name || 'Staff', actorId: identity?.id, target: discordId,
        description: `${identity?.name || 'Staff'} liberó el embargo de préstamo de ${discordId}`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'update_config') {
      const { minScoreToBorrow, rateTiers, maxLoanMultiplier, maxLoanAmount, termOptionsWeeks, missedPaymentsBeforeDefault } = body;
      const config = await updateLoanConfig({
        minScoreToBorrow, rateTiers, maxLoanMultiplier, maxLoanAmount, termOptionsWeeks, missedPaymentsBeforeDefault,
        updatedBy: identity?.name || 'Director',
      });
      await logStaffAction({
        type: 'loan_config_updated', category: 'ECONOMIA',
        actor: identity?.name || 'Director', actorId: identity?.id,
        description: `${identity?.name || 'Director'} actualizó la configuración de préstamos`,
      });
      return NextResponse.json({ success: true, config });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error administrando préstamos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

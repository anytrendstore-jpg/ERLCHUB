import { NextRequest, NextResponse } from 'next/server';
import { listDistributionRates, upsertDistributionRate, removeDistributionRate } from '@/lib/treasuryServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Tasas de distribución fiscal por departamento — siembra los 10 valores del spec la primera vez, después es 100% configurable. */
export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const rates = await listDistributionRates();
    return NextResponse.json({ success: true, rates });
  } catch (error) {
    console.error('Error leyendo tasas de distribución:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { departmentCode, percentage, label } = await request.json();
    const pct = Number(percentage);
    if (!departmentCode?.trim() || !label?.trim() || !Number.isFinite(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ success: false, error: 'Faltan datos válidos' }, { status: 400 });
    }

    const identity = staffIdentity();
    const rate = await upsertDistributionRate({ departmentCode, percentage: pct, label, updatedBy: identity?.name || 'Director' });

    await logStaffAction({
      type: 'treasury_distribution_rate_updated',
      category: 'ECONOMIA',
      actor: rate.updatedBy,
      actorId: identity?.id,
      description: `${rate.updatedBy} fijó la tasa de distribución de ${rate.departmentCode} en ${rate.percentage}%`,
    });

    return NextResponse.json({ success: true, rate });
  } catch (error) {
    console.error('Error guardando tasa de distribución:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { departmentCode } = await request.json();
    if (!departmentCode?.trim()) return NextResponse.json({ success: false, error: 'Falta el código de departamento' }, { status: 400 });

    await removeDistributionRate(departmentCode);

    const identity = staffIdentity();
    await logStaffAction({
      type: 'treasury_distribution_rate_updated',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      description: `${identity?.name || 'Director'} eliminó la tasa de distribución de ${departmentCode.trim().toUpperCase()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando tasa de distribución:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

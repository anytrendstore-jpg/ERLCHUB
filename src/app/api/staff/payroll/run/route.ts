import { NextResponse } from 'next/server';
import { runFullPayroll } from '@/lib/payrollServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Corrida manual de nómina — nunca bloqueada por el guard de idempotencia semanal del cron. */
export async function POST() {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const run = await runFullPayroll('manual', { id: identity?.id || 'staff', name: identity?.name || 'Director' });

    await logStaffAction({
      type: 'payroll_run_triggered',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      description: `${identity?.name || 'Director'} disparó una corrida manual de nómina — ${run.totals.paid} pagados, ${run.totals.skipped} saltados, retención $${run.totals.taxWithheld}`,
    });

    return NextResponse.json({ success: run.status !== 'failed', run });
  } catch (error) {
    console.error('Error ejecutando la nómina:', error);
    return NextResponse.json({ success: false, error: 'No se pudo ejecutar la nómina' }, { status: 500 });
  }
}

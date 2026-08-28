import { NextResponse } from 'next/server';
import { listPayrollEntries } from '@/lib/payrollServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { runId: string } }) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const entries = await listPayrollEntries(params.runId);
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('Error listando entradas de nómina:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

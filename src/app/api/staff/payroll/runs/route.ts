import { NextRequest, NextResponse } from 'next/server';
import { listPayrollRuns } from '@/lib/payrollServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 50;
    const runs = await listPayrollRuns(limit);
    return NextResponse.json({ success: true, runs });
  } catch (error) {
    console.error('Error listando corridas de nómina:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { runAutomaticTreasuryDistribution } from '@/lib/treasuryServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Disparado por Vercel Cron (ver vercel.json), 30 min después de la nómina semanal — le da tiempo
 * a que las retenciones de esa corrida ya estén acreditadas en el Tesoro antes de repartir. Mismo
 * criterio de autenticación que /api/cron/payroll.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const ok = auth === `Bearer ${process.env.CRON_SECRET}` || (!!querySecret && querySecret === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const result = await runAutomaticTreasuryDistribution('cron');
  return NextResponse.json({ success: true, ...result });
}

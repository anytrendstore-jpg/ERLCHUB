import { NextRequest, NextResponse } from 'next/server';
import { runFullPayroll } from '@/lib/payrollServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Disparado por Vercel Cron (ver vercel.json) — sin sesión de staff, mismo criterio que
 * /api/memberships/cron. Vercel adjunta 'Authorization: Bearer <CRON_SECRET>' automáticamente
 * en crons nativos cuando el proyecto tiene CRON_SECRET seteado. Se acepta también ?secret=
 * como respaldo, por si algo externo lo dispara en vez del cron nativo.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const ok = auth === `Bearer ${process.env.CRON_SECRET}` || (!!querySecret && querySecret === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const run = await runFullPayroll('cron');
  return NextResponse.json({ success: run.status !== 'failed', run });
}

import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyLoanPayments } from '@/lib/loansServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Corre DIARIO (a diferencia de nómina/tesoro que son semanales) porque cada préstamo vence 7 días
 * después de cuándo se pidió, no todos el mismo día de la semana — un cron semanal fijo dejaría
 * préstamos sin cobrar varios días. runWeeklyLoanPayments() ya filtra por nextPaymentDate vencida
 * y por lastPaymentPeriodKey (semana ISO), así que llamarlo todos los días es seguro: cada
 * préstamo se cobra una sola vez por semana, cerca de su vencimiento real. Mismo criterio de auth
 * que el resto de los crons.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const ok = auth === `Bearer ${process.env.CRON_SECRET}` || (!!querySecret && querySecret === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const result = await runWeeklyLoanPayments();
  return NextResponse.json({ success: true, ...result });
}

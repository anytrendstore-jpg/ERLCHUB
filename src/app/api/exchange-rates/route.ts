import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/exchangeRatesServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rates, source, updatedAt } = await getExchangeRates();
  return NextResponse.json({ success: true, rates, source, updatedAt });
}

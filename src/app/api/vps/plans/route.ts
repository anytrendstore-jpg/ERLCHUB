import { NextResponse } from 'next/server';
import { currentVpsUser, ensureVpsPlansSeeded } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await ensureVpsPlansSeeded();
    const plans = await col.find({ enabled: true }).sort({ order: 1 }).toArray();
    return NextResponse.json({ success: true, plans: plans.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando planes de VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

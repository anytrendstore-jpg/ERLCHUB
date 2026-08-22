import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, submitReport, type ReportTargetType } from '@/lib/hubCareerServer';

export const dynamic = 'force-dynamic';

const VALID_TYPES: ReportTargetType[] = ['user', 'post', 'company'];

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { targetType, targetId, targetLabel, reason } = await request.json();
    if (!VALID_TYPES.includes(targetType) || !targetId || !reason) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }
    const result = await submitReport(me, { targetType, targetId, targetLabel: targetLabel || '', reason });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enviando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar el reporte' }, { status: 500 });
  }
}

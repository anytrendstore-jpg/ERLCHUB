import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { staffReports, type ReportStatus } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** El jugador reporta a otro jugador. Llega directo a la cola de Reportes del staff. */
export async function POST(request: NextRequest) {
  const user = currentDiscordUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Inicia sesión con Discord para reportar' }, { status: 401 });
  }

  try {
    const { targetName, reason, details } = await request.json();
    if (!targetName?.trim() || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Indica a quién reportas y el motivo' }, { status: 400 });
    }

    const reporterName = user.global_name || user.username;
    const col = await staffReports();
    const doc = {
      id: crypto.randomUUID(),
      reporterName,
      reporterId: user.id,
      targetName: targetName.trim().slice(0, 100),
      reason: reason.trim().slice(0, 200),
      details: (details || '').trim().slice(0, 2000),
      status: 'open' as ReportStatus,
      createdAt: new Date(),
    };
    await col.insertOne(doc);
    const { _id, ...report } = doc as typeof doc & { _id?: unknown };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar el reporte' }, { status: 500 });
  }
}

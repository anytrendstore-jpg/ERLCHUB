import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialReportsCollection, currentSocialUser } from '@/lib/socialServer';
import type { SocialReportTargetType } from '@/lib/socialTypes';

export const dynamic = 'force-dynamic';

const VALID_TYPES: SocialReportTargetType[] = ['post', 'comment', 'user'];

/** Reporta una publicación, comentario o cuenta para revisión de staff. */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { targetType, targetId, postId, reason } = await request.json();
    if (!VALID_TYPES.includes(targetType) || !targetId) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }
    const trimmedReason = String(reason || '').trim().slice(0, 300);
    if (!trimmedReason) return NextResponse.json({ success: false, error: 'Describe el motivo del reporte' }, { status: 400 });

    const col = await socialReportsCollection();
    const doc = {
      id: crypto.randomUUID(),
      targetType: targetType as SocialReportTargetType,
      targetId: String(targetId),
      postId: postId ? String(postId) : undefined,
      reporterId: user.id,
      reporterUsername: user.username,
      reason: trimmedReason,
      status: 'pending' as const,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, report: doc });
  } catch (error) {
    console.error('Error creando reporte de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar el reporte' }, { status: 500 });
  }
}

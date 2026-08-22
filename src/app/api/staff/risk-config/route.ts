import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { getRiskConfig, updateRiskConfig } from '@/lib/riskConfigServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const config = await getRiskConfig();
    const { _id, ...clean } = config as any;
    return NextResponse.json({ success: true, config: clean });
  } catch (error) {
    console.error('Error leyendo configuración de riesgo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

const EDITABLE_KEYS = [
  'exposureDecayPerHour', 'maxDetectionChance', 'compromiseChanceUnprotected',
  'compromiseChanceProtected', 'compromiseLossRate', 'dailySendLimitCOP', 'unusualSendFraction',
] as const;

export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const body = await request.json();
    const updates: Record<string, number> = {};
    for (const key of EDITABLE_KEYS) {
      if (key in body && Number.isFinite(Number(body[key]))) updates[key] = Number(body[key]);
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Sin cambios válidos' }, { status: 400 });
    }

    const config = await updateRiskConfig(updates, identity?.name || 'Staff');
    await logStaffAction({
      type: 'risk_config_updated', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id,
      description: `${identity?.name || 'Staff'} actualizó la configuración de riesgo (Deep Web/Crypto)`,
      metadata: updates,
    });

    const { _id, ...clean } = config as any;
    return NextResponse.json({ success: true, config: clean });
  } catch (error) {
    console.error('Error actualizando configuración de riesgo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

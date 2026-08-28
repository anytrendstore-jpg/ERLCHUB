import { NextRequest, NextResponse } from 'next/server';
import { getEconomyConfig, updateEconomyConfig } from '@/lib/economyConfigServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Saldo inicial (efectivo/banco) de un personaje nuevo — configurable, nunca hardcodeado en la creación. */
export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const config = await getEconomyConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error leyendo config económica:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { startingCash, startingBank } = await request.json();
    const cash = Number(startingCash);
    const bank = Number(startingBank);
    if (!Number.isFinite(cash) || cash < 0 || !Number.isFinite(bank) || bank < 0) {
      return NextResponse.json({ success: false, error: 'Montos no válidos' }, { status: 400 });
    }

    const identity = staffIdentity();
    const config = await updateEconomyConfig({ startingCash: cash, startingBank: bank, updatedBy: identity?.name || 'Director' });

    await logStaffAction({
      type: 'economy_config_updated',
      category: 'ECONOMIA',
      actor: config.updatedBy,
      actorId: identity?.id,
      description: `${config.updatedBy} fijó el saldo inicial en $${config.startingCash} efectivo / $${config.startingBank} banco`,
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error actualizando config económica:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}

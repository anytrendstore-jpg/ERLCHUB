import { NextRequest, NextResponse } from 'next/server';
import { currentBankUser, getBalance, adjustBalance, getHubPayFreeze } from '@/lib/hubPayServer';
import { socialProfilesCollection } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';
import { economyTaxRates } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) {
      return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
    }

    const { toUser, amount, description } = await request.json();
    const sendAmount = Number(amount);
    if (!toUser || !Number.isFinite(sendAmount) || sendAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    // El destinatario puede venir como discordId o como @usuario (Roblox verificado).
    let targetId: string | null = null;
    let targetName = String(toUser).trim();
    if (targetName.startsWith('@')) targetName = targetName.slice(1);

    const profilesCol = await socialProfilesCollection();
    const byId = await profilesCol.findOne({ discordId: targetName });
    if (byId) {
      targetId = byId.discordId;
    } else {
      const byUsername = await profilesCol.findOne({ username: { $regex: `^${targetName}$`, $options: 'i' } });
      if (byUsername) targetId = byUsername.discordId;
    }

    if (!targetId) return NextResponse.json({ success: false, error: 'No se encontró ese usuario' }, { status: 404 });
    if (targetId === me.id) return NextResponse.json({ success: false, error: 'No puedes transferirte a ti mismo' }, { status: 400 });

    const taxCol = await economyTaxRates();
    const taxDoc = await taxCol.findOne({ category: 'transferencias' });
    const commissionRate = (taxDoc?.percentage ?? 0) / 100;
    const commission = Math.round(sendAmount * commissionRate * 100) / 100;
    const totalCharge = sendAmount + commission;

    const balance = await getBalance(me.id);
    if (balance < totalCharge) {
      return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });
    }

    const desc = description?.trim() || `Transferencia a @${targetName}`;

    const outTx = await adjustBalance({
      discordId: me.id,
      delta: -totalCharge,
      type: 'transfer_out',
      description: desc,
      counterpartyId: targetId,
      metadata: { commission, sendAmount },
    });
    await adjustBalance({
      discordId: targetId,
      delta: sendAmount,
      type: 'transfer_in',
      description: `Transferencia de @${me.username}`,
      counterpartyId: me.id,
    });

    await notifyUser(me.id, {
      title: 'Transferencia enviada',
      message: `Enviaste $${sendAmount.toLocaleString('es-CO')} a @${targetName}${commission > 0 ? ` (comisión $${commission.toLocaleString('es-CO')})` : ''}`,
      type: 'success',
      appId: 'hubpay',
    });
    await notifyUser(targetId, {
      title: 'Dinero recibido',
      message: `@${me.username} te transfirió $${sendAmount.toLocaleString('es-CO')}`,
      type: 'success',
      appId: 'hubpay',
    });

    return NextResponse.json({ success: true, transaction: outTx });
  } catch (error) {
    console.error('Error procesando transferencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la transferencia' }, { status: 500 });
  }
}

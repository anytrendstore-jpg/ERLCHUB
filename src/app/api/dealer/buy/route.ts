import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentDealerUser, dealerVehiclesCollection, playerVehiclesCollection } from '@/lib/dealerServer';
import { getBalance, adjustBalance } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const DOWN_PAYMENT_RATE = 0.2;
const PLATE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomPlate() {
  let s = '';
  for (let i = 0; i < 6; i++) s += PLATE_CHARS[Math.floor(Math.random() * PLATE_CHARS.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

export async function POST(request: NextRequest) {
  const me = await currentDealerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { vehicleId, financed, color, giftToId } = await request.json();
    const vehiclesCol = await dealerVehiclesCollection();
    const vehicle = await vehiclesCol.findOne({ id: vehicleId });
    if (!vehicle) return NextResponse.json({ success: false, error: 'Vehículo no encontrado' }, { status: 404 });
    if (vehicle.stock <= 0) return NextResponse.json({ success: false, error: 'Sin stock' }, { status: 400 });

    let giftRecipient: { discordId: string; username: string; displayName: string } | null = null;
    if (giftToId && giftToId !== me.id) {
      if (financed) return NextResponse.json({ success: false, error: 'No puedes regalar un vehículo financiado, debe pagarse de contado' }, { status: 400 });
      const profilesCol = await socialProfilesCollection();
      const p = await profilesCol.findOne({ discordId: giftToId });
      if (!p) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });
      giftRecipient = { discordId: p.discordId, username: p.username, displayName: p.displayName || p.username };
    }
    const ownerId = giftRecipient?.discordId || me.id;

    const chargeNow = financed ? Math.round(vehicle.price * DOWN_PAYMENT_RATE) : vehicle.price;
    const balance = await getBalance(me.id);
    if (balance < chargeNow) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    await adjustBalance({
      discordId: me.id,
      delta: -chargeNow,
      type: 'expense',
      description: giftRecipient
        ? `Regalo para @${giftRecipient.username}: ${vehicle.name}`
        : financed ? `Enganche - ${vehicle.name}` : `Compra - ${vehicle.name}`,
      counterpartyId: giftRecipient?.discordId,
    });

    await vehiclesCol.updateOne({ id: vehicleId }, { $inc: { stock: -1 } });

    const playerVehiclesCol = await playerVehiclesCollection();
    const doc = {
      id: crypto.randomUUID(),
      ownerId,
      vehicleId: vehicle.id,
      name: vehicle.name,
      brand: vehicle.brand,
      iconId: vehicle.iconId,
      imageUrl: vehicle.imageUrl,
      plate: randomPlate(),
      color: color || '#1f2937',
      financed: Boolean(financed),
      loanRemaining: financed ? vehicle.price - chargeNow : undefined,
      giftedBy: giftRecipient ? me.id : undefined,
      purchasedAt: new Date(),
    };
    await playerVehiclesCol.insertOne(doc);

    if (giftRecipient) {
      await notifyUser(me.id, { title: 'Regalo enviado', message: `Le regalaste ${vehicle.name} a ${giftRecipient.displayName}`, type: 'success', appId: 'dealer' });
      await notifyUser(giftRecipient.discordId, { title: '🎁 Recibiste un regalo', message: `${me.displayName} te regaló ${vehicle.name} en el Concesionario`, type: 'success', appId: 'dealer' });
    } else {
      await notifyUser(me.id, { title: 'Compra realizada', message: `Compraste ${vehicle.name} por $${chargeNow.toLocaleString('es-CO')}`, type: 'success', appId: 'dealer' });
    }

    return NextResponse.json({ success: true, vehicle: doc });
  } catch (error) {
    console.error('Error comprando vehículo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}

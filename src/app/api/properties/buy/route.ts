import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentPropertiesUser, propertyListingsCollection, playerPropertiesCollection } from '@/lib/propertiesServer';
import { getBalance, adjustBalance } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentPropertiesUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { listingId, giftToId } = await request.json();
    const listingsCol = await propertyListingsCollection();
    const listing = await listingsCol.findOne({ id: listingId });
    if (!listing) return NextResponse.json({ success: false, error: 'Propiedad no encontrada' }, { status: 404 });
    if (listing.stock <= 0) return NextResponse.json({ success: false, error: 'Sin disponibilidad' }, { status: 400 });

    let giftRecipient: { discordId: string; username: string; displayName: string } | null = null;
    if (giftToId && giftToId !== me.id) {
      const profilesCol = await socialProfilesCollection();
      const p = await profilesCol.findOne({ discordId: giftToId });
      if (!p) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });
      giftRecipient = { discordId: p.discordId, username: p.username, displayName: p.displayName || p.username };
    }
    const ownerId = giftRecipient?.discordId || me.id;

    const balance = await getBalance(me.id);
    if (balance < listing.price) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    await adjustBalance({
      discordId: me.id,
      delta: -listing.price,
      type: 'expense',
      description: giftRecipient ? `Regalo para @${giftRecipient.username}: ${listing.name}` : `Propiedad: ${listing.name}`,
      counterpartyId: giftRecipient?.discordId,
    });
    await listingsCol.updateOne({ id: listingId }, { $inc: { stock: -1 } });

    const propsCol = await playerPropertiesCollection();
    const doc = {
      id: crypto.randomUUID(), ownerId, listingId: listing.id,
      name: listing.name, type: listing.type, address: listing.address,
      giftedBy: giftRecipient ? me.id : undefined,
      purchasedAt: new Date(),
    };
    await propsCol.insertOne(doc);

    if (giftRecipient) {
      await notifyUser(me.id, { title: 'Regalo enviado', message: `Le regalaste ${listing.name} a ${giftRecipient.displayName}`, type: 'success', appId: 'properties' });
      await notifyUser(giftRecipient.discordId, { title: '🎁 Recibiste un regalo', message: `${me.displayName} te regaló la propiedad ${listing.name}`, type: 'success', appId: 'properties' });
    } else {
      await notifyUser(me.id, { title: 'Compra realizada', message: `Compraste la propiedad ${listing.name} por $${listing.price.toLocaleString('es-CO')}`, type: 'success', appId: 'properties' });
    }

    return NextResponse.json({ success: true, property: doc });
  } catch (error) {
    console.error('Error comprando propiedad:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}

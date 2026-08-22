import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentDeepWebUser, deepWebItemsCollection, playerDeepWebItemsCollection } from '@/lib/deepwebServer';
import { chargeCrypto, getDefaultCryptoCoin } from '@/lib/cryptoServer';
import { notifyUser } from '@/lib/notificationsServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** La Deep Web solo acepta pagos en Crypto Wallet — nunca dinero directo del Banco (HubPay). */
export async function POST(request: NextRequest) {
  const me = await currentDeepWebUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { itemId, giftToId } = await request.json();
    const itemsCol = await deepWebItemsCollection();
    const item = await itemsCol.findOne({ id: itemId });
    if (!item) return NextResponse.json({ success: false, error: 'Artículo no encontrado' }, { status: 404 });
    if (item.stock <= 0) return NextResponse.json({ success: false, error: 'Sin stock' }, { status: 400 });

    let giftRecipient: { discordId: string; username: string; displayName: string } | null = null;
    if (giftToId && giftToId !== me.id) {
      const profilesCol = await socialProfilesCollection();
      const p = await profilesCol.findOne({ discordId: giftToId });
      if (!p) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });
      giftRecipient = { discordId: p.discordId, username: p.username, displayName: p.displayName || p.username };
    }
    const ownerId = giftRecipient?.discordId || me.id;

    const coin = await getDefaultCryptoCoin();
    if (!coin) return NextResponse.json({ success: false, error: 'No hay criptomonedas disponibles' }, { status: 500 });

    const charge = await chargeCrypto(me.id, coin.id, item.price, giftRecipient ? `Regalo para @${giftRecipient.username}: ${item.name}` : `Deep Web: ${item.name}`);
    if (!charge.ok) return NextResponse.json({ success: false, error: charge.error }, { status: 400 });

    await itemsCol.updateOne({ id: itemId }, { $inc: { stock: -1 } });

    const ownedCol = await playerDeepWebItemsCollection();
    const doc = {
      id: crypto.randomUUID(), ownerId, itemId: item.id, name: item.name, category: item.category,
      giftedBy: giftRecipient ? me.id : undefined,
      purchasedAt: new Date(),
    };
    await ownedCol.insertOne(doc);

    if (giftRecipient) {
      await notifyUser(me.id, { title: 'Regalo enviado', message: `Le regalaste ${item.name} a ${giftRecipient.displayName}`, type: 'success', appId: 'deepweb' });
      await notifyUser(giftRecipient.discordId, { title: '🎁 Recibiste un regalo', message: `${me.displayName} te regaló ${item.name} en la Deep Web`, type: 'success', appId: 'deepweb' });
    } else {
      await notifyUser(me.id, { title: 'Compra realizada', message: `Compraste ${item.name} por ${charge.amount?.toFixed(4)} ${charge.coinSymbol}`, type: 'success', appId: 'deepweb' });
    }

    return NextResponse.json({ success: true, item: doc });
  } catch (error) {
    console.error('Error comprando en la Deep Web:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}

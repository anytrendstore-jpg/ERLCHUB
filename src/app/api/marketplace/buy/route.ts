import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMarketUser, marketplaceListingsCollection, marketplacePurchasesCollection } from '@/lib/marketplaceServer';
import { getBalance, adjustBalance, getHubPayFreeze, hubPayCardsCollection } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { economyTaxRates } from '@/lib/staffServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) {
      return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
    }

    const { listingId, quantity, cardId, giftToId } = await request.json();
    const qty = Math.max(1, Number(quantity) || 1);

    if (!cardId) return NextResponse.json({ success: false, error: 'Selecciona una tarjeta para pagar' }, { status: 400 });
    const cardsCol = await hubPayCardsCollection();
    const card = await cardsCol.findOne({ id: cardId, discordId: me.id });
    if (!card) return NextResponse.json({ success: false, error: 'Tarjeta no encontrada' }, { status: 404 });
    if (card.status !== 'active') return NextResponse.json({ success: false, error: 'Esa tarjeta no está activa' }, { status: 400 });

    let giftRecipient: { discordId: string; username: string; displayName: string } | null = null;
    if (giftToId && giftToId !== me.id) {
      const profilesCol = await socialProfilesCollection();
      const p = await profilesCol.findOne({ discordId: giftToId });
      if (!p) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });
      giftRecipient = { discordId: p.discordId, username: p.username, displayName: p.displayName || p.username };
    }

    const listingsCol = await marketplaceListingsCollection();
    const listing = await listingsCol.findOne({ id: listingId, status: 'active' });
    if (!listing) return NextResponse.json({ success: false, error: 'Publicación no disponible' }, { status: 404 });
    if (listing.sellerId === me.id) return NextResponse.json({ success: false, error: 'No puedes comprar tu propio artículo' }, { status: 400 });
    if (listing.stock < qty) return NextResponse.json({ success: false, error: 'Stock insuficiente' }, { status: 400 });

    const total = listing.price * qty;
    const balance = await getBalance(me.id);
    if (balance < total) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    const taxCol = await economyTaxRates();
    const taxDoc = await taxCol.findOne({ category: 'marketplace' });
    const commissionPct = taxDoc?.percentage ?? 0;
    const commission = Math.round(total * (commissionPct / 100));
    const sellerPayout = total - commission;

    await adjustBalance({
      discordId: me.id,
      delta: -total,
      type: 'expense',
      description: giftRecipient
        ? `Regalo para @${giftRecipient.username}: ${listing.name} x${qty} (Tarjeta •••• ${card.lastFourDigits})`
        : `Compra: ${listing.name} x${qty} (Tarjeta •••• ${card.lastFourDigits})`,
      counterpartyId: listing.sellerId,
      metadata: { cardId: card.id, cardLastFour: card.lastFourDigits, giftToId: giftRecipient?.discordId },
    });

    if (!listing.official) {
      await adjustBalance({
        discordId: listing.sellerId,
        delta: sellerPayout,
        type: 'transfer_in',
        description: `Venta: ${listing.name} x${qty}${commission > 0 ? ` (comisión MercadoLibre ${commissionPct}%: -$${commission.toLocaleString('es-CO')})` : ''}`,
        counterpartyId: me.id,
      });
    }

    await listingsCol.updateOne({ id: listingId }, { $inc: { stock: -qty }, $set: { updatedAt: new Date() } });

    const purchase = {
      id: crypto.randomUUID(),
      listingId,
      listingName: listing.name,
      buyerId: giftRecipient?.discordId || me.id,
      buyerUsername: giftRecipient?.displayName || me.displayName,
      sellerId: listing.sellerId,
      sellerUsername: listing.sellerUsername,
      price: listing.price,
      quantity: qty,
      total,
      commission,
      sellerPayout: listing.official ? total : sellerPayout,
      giftedBy: giftRecipient ? me.id : undefined,
      giftedByUsername: giftRecipient ? me.displayName : undefined,
      createdAt: new Date(),
    };
    const purchasesCol = await marketplacePurchasesCollection();
    await purchasesCol.insertOne(purchase);

    const remainingStock = listing.stock - qty;
    if (giftRecipient) {
      await notifyUser(me.id, {
        title: 'Regalo enviado',
        message: `Le regalaste ${listing.name} x${qty} a ${giftRecipient.displayName} por $${total.toLocaleString('es-CO')}`,
        type: 'success',
        appId: 'mercadolibre',
      });
      await notifyUser(giftRecipient.discordId, {
        title: '🎁 Recibiste un regalo',
        message: `${me.displayName} te regaló ${listing.name} x${qty} en MercadoLibre`,
        type: 'success',
        appId: 'mercadolibre',
      });
    } else {
      await notifyUser(me.id, {
        title: 'Compra realizada',
        message: `Compraste ${listing.name} x${qty} por $${total.toLocaleString('es-CO')}`,
        type: 'success',
        appId: 'mercadolibre',
      });
    }
    if (!listing.official) {
      await notifyUser(listing.sellerId, {
        title: 'Vendiste un artículo',
        message: `${me.displayName} compró ${listing.name} x${qty} por $${total.toLocaleString('es-CO')}`,
        type: 'success',
        appId: 'mercadolibre',
      });
      if (remainingStock <= 0) {
        await notifyUser(listing.sellerId, {
          title: 'Producto agotado',
          message: `${listing.name} se quedó sin stock.`,
          type: 'warning',
          appId: 'mercadolibre',
        });
      }
    }

    return NextResponse.json({ success: true, purchase });
  } catch (error) {
    console.error('Error procesando compra:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}

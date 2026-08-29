import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentPropertiesUser, propertyListingsCollection, playerPropertiesCollection } from '@/lib/propertiesServer';
import { getBalance, adjustBalance } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { socialProfilesCollection } from '@/lib/socialServer';
import { economyTaxRates } from '@/lib/staffServer';
import { adjustTreasury } from '@/lib/treasuryServer';

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

    // Esto es un impuesto de transferencia (se cobra una sola vez, al comprar) — no el Property
    // Tax semanal recurrente que describe el prompt del motor económico, porque eso requiere un
    // sistema de cobros automáticos periódicos que todavía no existe en el sitio.
    const taxCol = await economyTaxRates();
    const taxDoc = await taxCol.findOne({ category: 'property' });
    const taxRate = (taxDoc?.percentage ?? 0) / 100;
    const transferTax = Math.round(listing.price * taxRate * 100) / 100;
    const totalCharge = listing.price + transferTax;

    const balance = await getBalance(me.id);
    if (balance < totalCharge) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    await adjustBalance({
      discordId: me.id,
      delta: -totalCharge,
      type: 'expense',
      description: giftRecipient ? `Regalo para @${giftRecipient.username}: ${listing.name}` : `Propiedad: ${listing.name}`,
      counterpartyId: giftRecipient?.discordId,
      metadata: transferTax > 0 ? { transferTax } : undefined,
    });
    if (transferTax > 0) {
      await adjustTreasury({
        delta: transferTax, type: 'tax_revenue', description: `Property Tax (transferencia) — ${listing.name}`,
        actorId: 'system', actorName: 'Tienda de propiedades automática',
      });
    }
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
      await notifyUser(me.id, { title: 'Compra realizada', message: `Compraste la propiedad ${listing.name} por $${totalCharge.toLocaleString('es-CO')}${transferTax > 0 ? ` (incluye $${transferTax.toLocaleString('es-CO')} de impuesto)` : ''}`, type: 'success', appId: 'properties' });
    }

    return NextResponse.json({ success: true, property: doc });
  } catch (error) {
    console.error('Error comprando propiedad:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}

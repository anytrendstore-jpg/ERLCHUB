import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { claimOrderForDelivery, markOrderCompleted, markOrderFailed, getOrderByReference, type ShopOrder } from '@/lib/shopOrdersServer';
import { upsertSubscriptionFromPayment, recordFailedRenewal } from '@/lib/membershipSubscriptionsServer';

const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY;

/**
 * Webhook de Wompi — entrega real post-pago. Antes de esto (ver Fase C del plan) el checkout
 * no dejaba ningún rastro de qué se compraba, así que esto nunca encontraba nada que entregar.
 * Ahora la orden ya existe en Mongo (creada en /api/shop/checkout/prepare) antes de que el
 * comprador llegue a pagar — este webhook solo busca esa orden por `reference` y la entrega.
 */
export async function POST(request: NextRequest) {
  try {
    if (!WOMPI_INTEGRITY_KEY) {
      console.error('WOMPI_INTEGRITY_KEY no configurada — no se puede validar la firma del webhook');
      return NextResponse.json({ error: 'Pagos no configurados' }, { status: 500 });
    }

    const body = await request.json();

    const signature = request.headers.get('x-wompi-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Firma no encontrada' }, { status: 401 });
    }

    const computedSignature = crypto
      .createHmac('sha256', WOMPI_INTEGRITY_KEY)
      .update(JSON.stringify(body))
      .digest('hex');

    if (computedSignature !== signature) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const { event, data } = body;

    if (event === 'payment.approved') {
      await handleApprovedPayment(data);
    } else if (event === 'payment.declined' || event === 'payment.error' || event === 'payment.voided') {
      await handleFailedPayment(data);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error procesando evento de Wompi:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

async function handleApprovedPayment(paymentData: any) {
  const { reference, amount_in_cents } = paymentData;
  if (!reference) return;

  // Guardia atómica: solo una llamada pasa de 'pending' a 'delivering'. Si ya no está 'pending'
  // (no existe, ya se está entregando, ya se completó, o falló) no se hace nada más — cubre
  // reintentos del mismo evento por parte de Wompi sin entregar dos veces.
  const order = await claimOrderForDelivery(reference);
  if (!order) {
    const existing = await getOrderByReference(reference);
    if (!existing) console.log(`Wompi payment.approved sin orden asociada (reference=${reference}) — ignorado.`);
    return;
  }

  if (order.amountInCents !== amount_in_cents) {
    console.error(`Orden ${reference}: amount_in_cents no coincide (orden=${order.amountInCents}, Wompi=${amount_in_cents}) — no se entrega.`);
    await markOrderFailed(reference, 'amount_mismatch');
    return;
  }

  const errors: string[] = [];
  for (const item of order.items) {
    try {
      if (item.type === 'membership') {
        await deliverMembership(order, item, paymentData);
      } else if (item.type === 'hub-coins-package') {
        await deliverHubCoins(order, item);
      } else if (item.type === 'whitelist-fast') {
        await deliverWhitelistFast(order, item, paymentData);
      } else {
        errors.push(`Tipo no entregable por Wompi: ${item.type}`);
      }
    } catch (error) {
      console.error(`Error entregando item ${item.catalogId} de la orden ${reference}:`, error);
      errors.push(`${item.catalogId}: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }

  if (errors.length > 0) {
    await markOrderFailed(reference, errors.join('; '));
  } else {
    await markOrderCompleted(reference);
  }
}

/**
 * Cobro rechazado/con error/anulado. Si la orden es una renovación automática (isRenewal), esto
 * es lo que dispara el reintento con backoff (o la expiración al tercer fallo) — ver
 * recordFailedRenewal() en membershipSubscriptionsServer.ts. Para una compra normal fallida no
 * hay nada más que hacer que dejar la orden marcada como failed.
 */
async function handleFailedPayment(paymentData: any) {
  const { reference } = paymentData;
  if (!reference) return;

  const order = await claimOrderForDelivery(reference);
  if (!order) return; // no estaba 'pending' — ya se resolvió por otro evento, o no es nuestra.

  await markOrderFailed(reference, `wompi_${paymentData.status || 'declined'}`);

  const membershipItem = order.items.find((i) => i.type === 'membership');
  if (order.isRenewal && membershipItem) {
    const result = await recordFailedRenewal(order.discordId, membershipItem.catalogId);
    if (result.exhausted) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://www.erlchub.pro'}/api/discord-bot/revoke-membership`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: order.discordId, membershipId: membershipItem.catalogId, reason: 'Renovación automática falló 3 veces — tarjeta rechazada' }),
        });
      } catch (revokeError) {
        console.error('Error revocando membresía tras agotar reintentos de renovación:', revokeError);
      }
      const db = await connectToDatabase();
      await db.collection('users').updateOne({ discordId: order.discordId }, { $set: { 'membership.status': 'expired' } });
    }
  }
}

async function deliverMembership(order: ShopOrder, item: ShopOrder['items'][number], paymentData: any) {
  const db = await connectToDatabase();
  const now = new Date();

  await db.collection('users').updateOne(
    { discordId: order.discordId },
    {
      $set: {
        membership: {
          id: item.catalogId,
          name: item.name,
          type: item.paymentType || 'permanent',
          purchasedAt: now.toISOString(),
          expiresAt: item.paymentType === 'monthly' ? new Date(now.getTime() + 30 * 86400000).toISOString() : null,
        },
      },
      $push: {
        transactions: {
          type: 'membership_purchase',
          amount: item.unitPriceUSD * item.quantity,
          description: `Compra de membresía: ${item.name}`,
          timestamp: now.toISOString(),
          status: 'completed',
          metadata: { membershipId: item.catalogId, membershipName: item.name },
        },
      },
    } as any,
    { upsert: true }
  );

  // Única fuente de verdad para el cron de renovación (antes de esto, el webhook nunca tocaba
  // membership_subscriptions — solo el campo embebido de arriba). Si ya hay una suscripción
  // activa para este usuario+membresía, esto la EXTIENDE (caso renovación) en vez de duplicarla.
  await upsertSubscriptionFromPayment({
    userId: order.discordId,
    membershipId: item.catalogId,
    membershipName: item.name,
    membershipType: item.paymentType || 'permanent',
    renewalPrice: item.unitPriceUSD,
    benefits: [],
    transactionId: paymentData.id,
    paymentSourceId: order.paymentSourceId,
  });

  try {
    const botResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://www.erlchub.pro'}/api/discord-bot/deliver-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: order.discordId,
        membershipId: item.catalogId,
        membershipName: item.name,
        membershipType: item.paymentType || 'permanent',
        membershipPrice: item.unitPriceUSD,
        serverId: '1432194616224120916',
        transactionId: paymentData.id,
      }),
    });
    if (!botResponse.ok) console.error(`Error entregando membresía ${item.name} vía Discord bot: HTTP ${botResponse.status}`);
  } catch (botError) {
    console.error('Error en integración con bot de Discord (membresía):', botError);
  }
}

async function deliverHubCoins(order: ShopOrder, item: ShopOrder['items'][number]) {
  const db = await connectToDatabase();
  // catalogItem trae coins/bonus reales — se releen acá (no confiar en lo que quedó cacheado en la orden más allá del precio ya fijado).
  const catalogItem = await db.collection('shop_catalog').findOne({ id: item.catalogId });
  const coins = (catalogItem?.coins || 0) * item.quantity;
  const bonus = (catalogItem?.bonus || 0) * item.quantity;
  const total = coins + bonus;

  await db.collection('users').updateOne(
    { discordId: order.discordId },
    { $inc: { hubCoins: total }, $setOnInsert: { discordId: order.discordId } },
    { upsert: true }
  );

  await db.collection('hubcoins_transactions').insertOne({
    userId: order.discordId,
    amount: total,
    type: 'purchase',
    description: `Compra de ${coins.toLocaleString()} + ${bonus.toLocaleString()} bonus Hub Coins`,
    status: 'completed',
    metadata: { catalogId: item.catalogId, coins, bonus, priceUSD: item.unitPriceUSD * item.quantity, orderReference: order.reference },
    timestamp: new Date(),
  });
}

async function deliverWhitelistFast(order: ShopOrder, item: ShopOrder['items'][number], paymentData: any) {
  const db = await connectToDatabase();
  const catalogItem = await db.collection('shop_catalog').findOne({ id: item.catalogId });
  const items: string[] = catalogItem?.items || [];
  const now = new Date();

  await db.collection('whitelist_fast_purchases').insertOne({
    userId: order.discordId,
    transactionId: paymentData.id,
    amount: item.unitPriceUSD,
    kitName: item.name,
    status: 'active',
    purchasedAt: now,
    deliveredAt: null,
    items,
  });

  await db.collection('users').updateOne(
    { discordId: order.discordId },
    { $set: { whitelistFast: { active: true, purchasedAt: now, transactionId: paymentData.id } } },
    { upsert: true }
  );

  await db.collection('hubcoins_transactions').insertOne({
    userId: order.discordId,
    amount: item.unitPriceUSD,
    type: 'purchase',
    description: 'Whitelist Fast - Acceso inmediato al servidor',
    status: 'completed',
    metadata: { catalogId: item.catalogId, transactionId: paymentData.id, items, orderReference: order.reference },
    timestamp: now,
  });

  try {
    const deliveryResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://www.erlchub.pro'}/api/discord-bot/deliver-whitelist-fast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: order.discordId, transactionId: paymentData.id, kitName: item.name, items }),
    });
    if (deliveryResponse.ok) {
      await db.collection('whitelist_fast_purchases').updateOne(
        { userId: order.discordId, transactionId: paymentData.id },
        { $set: { deliveredAt: new Date() } }
      );
    }
  } catch (discordError) {
    console.error('Error entregando Whitelist Fast en Discord:', discordError);
  }
}

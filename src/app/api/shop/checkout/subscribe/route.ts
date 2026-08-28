import { NextRequest, NextResponse } from 'next/server';
import { shopCatalogCollection } from '@/lib/shopCatalogServer';
import { createOrder } from '@/lib/shopOrdersServer';
import { createPaymentSource, chargePaymentSource } from '@/lib/wompiServer';

export const dynamic = 'force-dynamic';

const USD_TO_COP = 4000; // mismo tipo de cambio fijo que /api/shop/checkout/prepare (Fase C) — no se toca acá.

function generateReference(): string {
  return `ERLC_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Alta de membresía MENSUAL con auto-renovación: tokeniza -> crea Payment Source -> primer
 * cobro. El resultado real llega por el webhook de Wompi como cualquier otro pago — acá solo
 * se confirma que Wompi aceptó el intento. Las membresías permanentes (pago único) NO pasan
 * por acá, siguen usando el checkout normal (/api/shop/checkout/prepare) porque no hay nada
 * que renovar.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, customerEmail, catalogId, cardToken } = await request.json();
    if (!userId || !customerEmail || !catalogId || !cardToken) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const catalogCol = await shopCatalogCollection();
    const catalogItem = await catalogCol.findOne({ id: catalogId, active: true, type: 'membership' });
    if (!catalogItem || catalogItem.type !== 'membership') {
      return NextResponse.json({ success: false, error: 'Membresía no encontrada' }, { status: 404 });
    }

    const unitPriceUSD = catalogItem.priceMonthly;
    const amountInCents = Math.round(unitPriceUSD * USD_TO_COP * 100);
    const reference = generateReference();

    const paymentSource = await createPaymentSource({ cardToken, customerEmail });

    await createOrder({
      reference,
      discordId: userId,
      items: [{ catalogId: catalogItem.id, type: 'membership', name: catalogItem.name, quantity: 1, unitPriceUSD, paymentType: 'monthly' }],
      amountUSD: unitPriceUSD,
      amountInCents,
      paymentSourceId: paymentSource.id,
    });

    await chargePaymentSource({ paymentSourceId: paymentSource.id, amountInCents, reference, customerEmail });

    return NextResponse.json({ success: true, reference, status: 'processing' });
  } catch (error) {
    console.error('Error iniciando suscripción con auto-renovación:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo iniciar la suscripción' }, { status: 500 });
  }
}

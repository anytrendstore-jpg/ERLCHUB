import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { shopCatalogCollection } from '@/lib/shopCatalogServer';
import { createOrder, type ShopOrderItem } from '@/lib/shopOrdersServer';
import { getUsdToCopRate } from '@/lib/exchangeRatesServer';
import { connectToDatabase } from '@/lib/mongodb';
import { hasCompletedPurchase } from '@/lib/firstPurchaseDiscountServer';

export const dynamic = 'force-dynamic';

const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY;

function generateReference(): string {
  return `ERLC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Crea la orden ANTES de mandar al comprador a pagar. El cliente solo manda QUÉ quiere comprar
 * (catalogId/quantity/paymentType) — el precio se calcula acá contra el catálogo real, nunca
 * confiando en un monto que venga del navegador. El reference que devuelve es lo que
 * /api/shop/checkout/charge usa para cobrar con la tarjeta tokenizada; el webhook (wompi/events)
 * busca la orden por ese mismo reference cuando el pago se aprueba.
 */
export async function POST(request: NextRequest) {
  try {
    if (!WOMPI_INTEGRITY_KEY) {
      return NextResponse.json({ success: false, error: 'Pagos no configurados (falta WOMPI_INTEGRITY_KEY)' }, { status: 500 });
    }

    const { userId, items, discountCode } = await request.json();
    if (!userId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    const catalogCol = await shopCatalogCollection();
    const orderItems: ShopOrderItem[] = [];
    let amountUSD = 0;

    for (const raw of items) {
      const catalogItem = await catalogCol.findOne({ id: raw.catalogId, active: true });
      if (!catalogItem) {
        return NextResponse.json({ success: false, error: `Producto no encontrado: ${raw.catalogId}` }, { status: 404 });
      }

      const quantity = Math.max(1, Number(raw.quantity) || 1);
      let unitPriceUSD: number;

      if (catalogItem.type === 'membership') {
        const paymentType: 'monthly' | 'permanent' = raw.paymentType === 'monthly' ? 'monthly' : 'permanent';
        unitPriceUSD = paymentType === 'monthly' ? catalogItem.priceMonthly : catalogItem.pricePermanent;
        orderItems.push({ catalogId: catalogItem.id, type: 'membership', name: catalogItem.name, quantity, unitPriceUSD, paymentType });
      } else if (catalogItem.type === 'hub-coins-package') {
        unitPriceUSD = catalogItem.priceUSD;
        orderItems.push({ catalogId: catalogItem.id, type: 'hub-coins-package', name: `${catalogItem.coins} Hub Coins`, quantity, unitPriceUSD });
      } else if (catalogItem.type === 'whitelist-fast') {
        unitPriceUSD = catalogItem.priceDollars;
        orderItems.push({ catalogId: catalogItem.id, type: 'whitelist-fast', name: catalogItem.name, quantity, unitPriceUSD });
      } else {
        return NextResponse.json({ success: false, error: `"${catalogItem.type}" no se paga con dinero real — usá Hub Coins` }, { status: 400 });
      }

      amountUSD += unitPriceUSD * quantity;
    }

    if (amountUSD <= 0) {
      return NextResponse.json({ success: false, error: 'Monto inválido' }, { status: 400 });
    }

    const originalAmountUSD = amountUSD;
    let appliedDiscountCode: string | undefined;
    let appliedDiscountPercentage: number | undefined;

    if (discountCode && typeof discountCode === 'string') {
      const normalizedCode = discountCode.toUpperCase().trim();
      const db = await connectToDatabase();
      const codeDoc = await db.collection('discount_codes').findOne({ code: normalizedCode, isActive: true });

      if (!codeDoc) {
        return NextResponse.json({ success: false, error: 'Código de descuento no válido o expirado' }, { status: 400 });
      }
      if (new Date(codeDoc.expiresAt) < new Date()) {
        return NextResponse.json({ success: false, error: 'Código de descuento expirado' }, { status: 400 });
      }
      if (codeDoc.maxUses && codeDoc.usageCount >= codeDoc.maxUses) {
        return NextResponse.json({ success: false, error: 'Código de descuento ha alcanzado el límite de usos' }, { status: 400 });
      }
      // Nunca se confía en que el navegador diga "soy elegible" — se revisa de nuevo acá,
      // justo antes de cobrar de verdad, aunque ya se haya revisado al validar el código.
      if (codeDoc.firstPurchaseOnly && await hasCompletedPurchase(userId)) {
        return NextResponse.json({ success: false, error: 'Ese código es solo para tu primera compra' }, { status: 400 });
      }

      amountUSD = amountUSD * (1 - codeDoc.discountPercentage / 100);
      appliedDiscountCode = normalizedCode;
      appliedDiscountPercentage = codeDoc.discountPercentage;
    }

    const usdToCop = await getUsdToCopRate();
    const amountInCents = Math.round(amountUSD * usdToCop * 100);
    const reference = generateReference();

    await createOrder({
      reference,
      discordId: userId,
      items: orderItems,
      amountUSD,
      amountInCents,
      discountCode: appliedDiscountCode,
      discountPercentage: appliedDiscountPercentage,
      originalAmountUSD: appliedDiscountCode ? originalAmountUSD : undefined,
    });

    const signature = crypto
      .createHash('sha256')
      .update(`${reference}${amountInCents}COP${WOMPI_INTEGRITY_KEY}`)
      .digest('hex');

    return NextResponse.json({ success: true, reference, signature, amountInCents });
  } catch (error) {
    console.error('Error preparando el checkout:', error);
    return NextResponse.json({ success: false, error: 'No se pudo iniciar el pago' }, { status: 500 });
  }
}

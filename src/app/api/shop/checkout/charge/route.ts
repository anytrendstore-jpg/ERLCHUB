import { NextRequest, NextResponse } from 'next/server';
import { getOrderByReference } from '@/lib/shopOrdersServer';
import { createPaymentSource, chargePaymentSource } from '@/lib/wompiServer';

export const dynamic = 'force-dynamic';

/**
 * Cobra una orden que ya creó /api/shop/checkout/prepare, usando un card_token tokenizado en
 * el navegador (ver CardTokenizeForm) en vez del widget alojado de Wompi — el mismo mecanismo
 * que ya usa la renovación automática de membresías (Fase D), pero para un pago único. Evita
 * que el comprador tenga que pasar por el checkout hospedado de Wompi (que pide más datos de
 * los necesarios) solo para comprar algo de la tienda.
 *
 * El resultado real (aprobado/rechazado) sigue llegando por el webhook de Wompi como siempre
 * — acá solo se devuelve el estado inmediato que contesta la API al crear la transacción, para
 * poder avisarle al usuario de una vez si la tarjeta fue rechazada en vez de mandarlo a una
 * pantalla de éxito falsa.
 */
export async function POST(request: NextRequest) {
  try {
    const { reference, cardToken, customerEmail } = await request.json();
    if (!reference || !cardToken || !customerEmail) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const order = await getOrderByReference(reference);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Esta orden ya fue procesada' }, { status: 400 });
    }

    const paymentSource = await createPaymentSource({ cardToken, customerEmail });
    const transaction = await chargePaymentSource({
      paymentSourceId: paymentSource.id,
      amountInCents: order.amountInCents,
      reference: order.reference,
      customerEmail,
    });

    return NextResponse.json({ success: true, status: transaction.status });
  } catch (error) {
    console.error('Error cobrando la orden:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo procesar el pago',
    }, { status: 500 });
  }
}

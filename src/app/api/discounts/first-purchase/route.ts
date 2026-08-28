import { NextRequest, NextResponse } from 'next/server';
import { ensureFirstPurchaseDiscountCode, hasCompletedPurchase, FIRST_PURCHASE_CODE, FIRST_PURCHASE_PERCENTAGE } from '@/lib/firstPurchaseDiscountServer';

export const dynamic = 'force-dynamic';

/** ¿Este jugador todavía no hizo ninguna compra real (shop_orders completada)? Si es así, es elegible para el 15% de bienvenida. */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId requerido' }, { status: 400 });
    }

    await ensureFirstPurchaseDiscountCode();
    const alreadyPurchased = await hasCompletedPurchase(userId);

    return NextResponse.json({
      success: true,
      eligible: !alreadyPurchased,
      code: FIRST_PURCHASE_CODE,
      discountPercentage: FIRST_PURCHASE_PERCENTAGE,
    });
  } catch (error) {
    console.error('Error verificando elegibilidad de descuento de primera compra:', error);
    return NextResponse.json({ success: false, error: 'No se pudo verificar la elegibilidad' }, { status: 500 });
  }
}

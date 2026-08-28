import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hasCompletedPurchase } from '@/lib/firstPurchaseDiscountServer';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de descuento requerido' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();

    const normalizedCode = code.toUpperCase().trim();

    const discountCode = await db.collection('discount_codes').findOne({ 
      code: normalizedCode,
      isActive: true
    });

    if (!discountCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de descuento no válido o expirado' 
      }, { status: 404 });
    }

    const now = new Date();
    if (new Date(discountCode.expiresAt) < now) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de descuento expirado' 
      }, { status: 400 });
    }

    if (discountCode.maxUses && discountCode.usageCount >= discountCode.maxUses) {
      return NextResponse.json({
        success: false,
        error: 'Código de descuento ha alcanzado el límite de usos'
      }, { status: 400 });
    }

    if (discountCode.firstPurchaseOnly) {
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Iniciá sesión para usar este código'
        }, { status: 401 });
      }
      if (await hasCompletedPurchase(userId)) {
        return NextResponse.json({
          success: false,
          error: 'Este código es solo para tu primera compra'
        }, { status: 400 });
      }
    }

    await db.collection('discount_codes').updateOne(
      { _id: discountCode._id },
      { $inc: { usageCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      discountCode: {
        code: normalizedCode,
        discountPercentage: discountCode.discountPercentage,
        description: discountCode.description,
        expiresAt: discountCode.expiresAt
      },
      message: 'Código de descuento aplicado exitosamente'
    });

  } catch (error) {
    console.error('Error validando código de descuento:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
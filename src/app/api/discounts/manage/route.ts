import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface DiscountCode {
  code: string;
  discountPercentage: number;
  description: string;
  daysToExpire: number;
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Acción requerida' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();

    switch (action) {
      case 'create':
        return await createDiscountCode(data, db);
      
      case 'delete':
        return await deleteDiscountCode(data, db);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Acción no válida' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error en gestión de descuentos:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    const discountCodes = await db.collection('discount_codes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      codes: discountCodes.map((code: any) => ({
        ...code,
        isActive: new Date(code.expiresAt) > new Date()
      }))
    });

  } catch (error) {
    console.error('Error obteniendo códigos de descuento:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function createDiscountCode(data: DiscountCode, db: any) {
  try {
    const { code, discountPercentage, description, daysToExpire } = data;

    if (!code || !discountPercentage || !daysToExpire) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para crear el código de descuento' 
      }, { status: 400 });
    }

    const existingCode = await db.collection('discount_codes').findOne({ 
      code: code.toUpperCase() 
    });

    if (existingCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Este código de descuento ya existe' 
      }, { status: 400 });
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return NextResponse.json({ 
        success: false, 
        error: 'El porcentaje de descuento debe estar entre 1 y 100' 
      }, { status: 400 });
    }

    if (daysToExpire < 1 || daysToExpire > 365) {
      return NextResponse.json({ 
        success: false, 
        error: 'Los días de vencimiento deben estar entre 1 y 365' 
      }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + daysToExpire * 24 * 60 * 60 * 1000);

    const discountCode = {
      code: code.toUpperCase(),
      discountPercentage,
      description,
      createdAt: now,
      expiresAt,
      isActive: true,
      usageCount: 0
    };

    await db.collection('discount_codes').insertOne(discountCode);

    console.log(`Discount code created: ${code.toUpperCase()} - ${discountPercentage}% - Expires: ${expiresAt}`);

    return NextResponse.json({
      success: true,
      message: 'Código de descuento creado exitosamente',
      discountCode: {
        ...discountCode,
        id: discountCode._id?.toString()
      }
    });

  } catch (error) {
    console.error('Error creando código de descuento:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function deleteDiscountCode(data: { codeId: string }, db: any) {
  try {
    const { codeId } = data;

    if (!codeId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID del código requerido' 
      }, { status: 400 });
    }

    const result = await db.collection('discount_codes').deleteOne({ _id: codeId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de descuento no encontrado' 
      }, { status: 404 });
    }

    console.log(`Discount code deleted: ${codeId}`);

    return NextResponse.json({
      success: true,
      message: 'Código de descuento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando código de descuento:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
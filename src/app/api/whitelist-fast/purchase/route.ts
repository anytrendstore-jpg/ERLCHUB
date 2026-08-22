import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { whitelistFastKit } from '@/lib/shopData';

interface WhitelistFastPurchase {
  userId: string;
  transactionId: string;
  amount: number;
  selectedServer?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionId, amount, selectedServer = 'los-santos' }: WhitelistFastPurchase = await request.json();

    if (!userId || !transactionId || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para la compra de Whitelist Fast' 
      }, { status: 400 });
    }

    if (amount !== whitelistFastKit.priceDollars) {
      return NextResponse.json({ 
        success: false, 
        error: 'Monto incorrecto para Whitelist Fast' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    const existingPurchase = await db.collection('whitelist_fast_purchases')
      .findOne({ userId, status: 'active' });

    if (existingPurchase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ya tienes una Whitelist Fast activa' 
      }, { status: 400 });
    }

    const purchase = {
      userId,
      transactionId,
      amount,
      selectedServer,
      kitName: whitelistFastKit.name,
      status: 'active',
      purchasedAt: new Date(),
      deliveredAt: null,
      items: whitelistFastKit.items
    };

    await db.collection('whitelist_fast_purchases').insertOne(purchase);

    await db.collection('users').updateOne(
      { discordId: userId },
      { 
        $set: { 
          whitelistFast: {
            active: true,
            purchasedAt: new Date(),
            selectedServer,
            transactionId
          }
        }
      },
      { upsert: true }
    );

    await db.collection('hubcoins_transactions').insertOne({
      userId,
      amount,
      type: 'purchase',
      description: `Whitelist Fast - Acceso inmediato al servidor`,
      status: 'completed',
      metadata: {
        kitId: whitelistFastKit.id,
        kitName: whitelistFastKit.name,
        selectedServer,
        transactionId,
        items: whitelistFastKit.items
      },
      timestamp: new Date()
    });

    try {
      const deliveryResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/discord-bot/deliver-whitelist-fast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactionId,
          selectedServer,
          kitName: whitelistFastKit.name,
          items: whitelistFastKit.items
        })
      });

      if (deliveryResponse.ok) {
        await db.collection('whitelist_fast_purchases').updateOne(
          { userId, transactionId },
          { $set: { deliveredAt: new Date() } }
        );
      }
    } catch (discordError) {
      console.error('Error entregando Whitelist Fast en Discord:', discordError);
    }

    return NextResponse.json({
      success: true,
      message: 'Whitelist Fast comprada exitosamente',
      purchase: {
        ...purchase,
        _id: 'generated-id'
      }
    });

  } catch (error) {
    console.error('Error en compra de Whitelist Fast:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID requerido' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    const purchase = await db.collection('whitelist_fast_purchases')
      .findOne({ userId, status: 'active' });

    return NextResponse.json({
      success: true,
      hasWhitelistFast: !!purchase,
      purchase: purchase ? {
        ...purchase,
        purchasedAt: purchase.purchasedAt,
        selectedServer: purchase.selectedServer
      } : null
    });

  } catch (error) {
    console.error('Error obteniendo Whitelist Fast:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
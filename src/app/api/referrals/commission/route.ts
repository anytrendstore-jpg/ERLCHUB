import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { referralCode, purchaserId, purchaseAmount } = await request.json();

    if (!referralCode || !purchaserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de referido y ID del comprador son requeridos' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    const referral = await db.collection('referral_codes').findOne({ 
      code: referralCode.toLowerCase() 
    });

    if (!referral) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de referido no encontrado' 
      }, { status: 404 });
    }

    const referrerId = referral.userId;

    if (referrerId === purchaserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No puedes usar tu propio código de referido' 
      }, { status: 400 });
    }

    const existingCommission = await db.collection('referral_commissions').findOne({
      referrerId,
      purchaserId,
      referralCode: referralCode.toLowerCase(),
      purchaseAmount
    });

    if (existingCommission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Esta compra ya fue procesada para comisión' 
      }, { status: 400 });
    }

    const commissionAmount = 250;
    const transactionResult = await db.collection('hub_coins_transactions').insertOne({
      userId: referrerId,
      amount: commissionAmount,
      type: 'referral_commission',
      description: `Comisión de referido por compra de ${purchaserId}`,
      status: 'completed',
      createdAt: new Date(),
      metadata: {
        referralCode: referralCode.toLowerCase(),
        purchaserId,
        purchaseAmount
      }
    });

    await db.collection('hub_coins_balances').updateOne(
      { userId: referrerId },
      { 
        $inc: { balance: commissionAmount },
        $setOnInsert: { 
          userId: referrerId,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    await db.collection('referral_commissions').insertOne({
      referrerId,
      purchaserId,
      referralCode: referralCode.toLowerCase(),
      purchaseAmount,
      commissionAmount,
      status: 'completed',
      createdAt: new Date(),
      transactionId: transactionResult.insertedId
    });

    await db.collection('referral_stats').updateOne(
      { userId: referrerId },
      { 
        $inc: { 
          totalReferrals: 1,
          totalHubCoinsEarned: commissionAmount
        },
        $setOnInsert: { 
          userId: referrerId,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Comisión de ${commissionAmount} Hub Coins procesada exitosamente`,
      commissionAmount,
      referrerId
    });

  } catch (error) {
    console.error('Error processing referral commission:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
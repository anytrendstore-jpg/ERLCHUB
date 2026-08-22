import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface ReferralCode {
  userId: string;
  code: string;
  createdAt: Date;
  isActive: boolean;
}

interface Referral {
  userId: string;
  referredUserId: string;
  referredUsername: string;
  referredAvatar: string;
  referralCode: string;
  status: 'pending' | 'completed';
  commissionAmount: number; 
  createdAt: Date;
  completedAt?: Date;
  transactionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();

    switch (action) {
      case 'create_code':
        return await createReferralCode(userId, data?.code, db);
      
      case 'validate_code':
        return await validateReferralCode(data?.code, db);
      
      case 'process_referral':
        return await processReferral(userId, data, db);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Acción no válida' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error en gestión de referidos:', error);
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
    const lookupCode = searchParams.get('lookupCode');

    if (lookupCode && userId) {
      const db = await connectToDatabase();
      const referral = await db.collection('referral_codes').findOne({ 
        code: lookupCode.toLowerCase() 
      });

      if (referral) {
        const referrerUser = await db.collection('users').findOne({ 
          id: referral.userId 
        });

        return NextResponse.json({
          success: true,
          referrerName: referrerUser?.username || referrerUser?.displayName || 'Referido',
          referrerId: referral.userId
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Código de referido no encontrado'
        }, { status: 404 });
      }
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de usuario requerido' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    let referralCode = await db.collection('referral_codes').findOne({ userId });

    const referrals = await db.collection('referrals')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    const totalReferrals = referrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const totalHubCoinsEarned = referrals
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.commissionAmount, 0);

    const recentReferrals = await Promise.all(
      referrals.slice(0, 10).map(async (referral) => {
        const referredUser = await db.collection('users').findOne({ discordId: referral.referredUserId });
        
        return {
          ...referral,
          referredUsername: referredUser?.username || referral.referredUsername,
          referredAvatar: referredUser?.avatar || referral.referredAvatar,
          commissionAmount: referral.status === 'completed' ? referral.commissionAmount : 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      referralData: {
        referralCode: referralCode?.code || "",
        referralLink: referralCode?.code ? `${process.env.NEXT_PUBLIC_URL}?ref=${referralCode.code}` : "",
        totalReferrals,
        pendingReferrals,
        totalHubCoinsEarned,
        recentReferrals
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos de referidos:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function createReferralCode(userId: string, customCode?: string, db?: any) {
  try {
    if (!db) {
      db = await connectToDatabase();
    }

    const existingCode = await db.collection('referral_codes').findOne({ userId });
    if (existingCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ya tienes un código de referido' 
      }, { status: 400 });
    }

    let code = customCode;
    if (customCode) {
      code = customCode.toLowerCase();
      
      const validation = validateReferralCodeFormat(code);
      
      if (!validation.isValid) {
        return NextResponse.json({ 
          success: false, 
          error: validation.error,
          validation: validation
        }, { status: 400 });
      }
      
      const codeExists = await db.collection('referral_codes').findOne({ code });
      if (codeExists) {
        return NextResponse.json({ 
          success: false, 
          error: 'Ese código ya está en uso',
          validation: { ...validation, codeInUse: true }
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Debes proporcionar un código de referido personalizado' 
      }, { status: 400 });
    }

    const referralCode = {
      userId,
      code,
      createdAt: new Date(),
      isActive: true
    };

    await db.collection('referral_codes').insertOne(referralCode);

    return NextResponse.json({
      success: true,
      message: 'Código de referido creado exitosamente',
      referralCode: code,
      referralLink: `${process.env.NEXT_PUBLIC_URL}?ref=${code}`
    });

  } catch (error) {
    console.error('Error creando código de referido:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function validateReferralCode(code: string, db?: any) {
  try {
    if (!db) {
      db = await connectToDatabase();
    }

    const normalizedCode = code.toLowerCase();
    
    if (!/^[a-z0-9]{5}$/.test(normalizedCode)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de referido inválido' 
      }, { status: 400 });
    }

    const referralCode = await db.collection('referral_codes').findOne({ 
      code: normalizedCode, 
      isActive: true 
    });

    if (!referralCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de referido no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      referralCode: {
        code: referralCode.code,
        referrerId: referralCode.userId
      }
    });

  } catch (error) {
    console.error('Error validando código de referido:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function processReferral(userId: string, data: any, db?: any) {
  try {
    if (!db) {
      db = await connectToDatabase();
    }

    const { referralCode, transactionId, amount } = data;

    if (!referralCode || !transactionId || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para procesar referido' 
      }, { status: 400 });
    }

    const codeValidation = await validateReferralCode(referralCode, db);
    if (!codeValidation.ok) {
      return codeValidation;
    }

    const validationData = await codeValidation.json();
    const referrerId = validationData.referralCode.referrerId;

    if (referrerId === userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No puedes usar tu propio código de referido' 
      }, { status: 400 });
    }

    const existingReferral = await db.collection('referrals').findOne({
      referredUserId: userId,
      transactionId
    });

    if (existingReferral) {
      return NextResponse.json({ 
        success: false, 
        error: 'Esta transacción ya ha sido procesada como referido' 
      }, { status: 400 });
    }

    const referredUser = await db.collection('users').findOne({ discordId: userId });
    const referral: Referral = {
      userId: referrerId,
      referredUserId: userId,
      referredUsername: referredUser?.username || `User_${userId}`,
      referredAvatar: referredUser?.avatar || '',
      referralCode: referralCode.toLowerCase(),
      status: 'completed',
      commissionAmount: 250, 
      createdAt: new Date(),
      completedAt: new Date(),
      transactionId
    };

    await db.collection('referrals').insertOne(referral);
    await db.collection('users').updateOne(
      { discordId: referrerId },
      { $inc: { hubCoins: 250 } }
    );
    await db.collection('hubcoins_transactions').insertOne({
      userId: referrerId,
      amount: 250,
      type: 'referral_commission',
      description: `Comisión de referido - ${referredUser?.username || 'Usuario'}`,
      status: 'completed',
      metadata: {
        referralCode: referralCode.toLowerCase(),
        referredUserId: userId,
        referredUsername: referredUser?.username || `User_${userId}`,
        transactionId,
        commissionAmount: 250
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Referido procesado exitosamente',
      commission: 250
    });

  } catch (error) {
    console.error('Error procesando referido:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

function generateReferralCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function validateReferralCodeFormat(code: string): {
  isValid: boolean;
  hasValidLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  noSpecialChars: boolean;
  error: string;
} {
  const hasValidLength = code.length === 5;
  const hasNumber = /\d/.test(code);
  const hasLetter = /[a-z]/.test(code);
  const noSpecialChars = /^[a-z0-9]+$/.test(code);

  const isValid = hasValidLength && hasNumber && hasLetter && noSpecialChars;

  let error = '';
  if (!hasValidLength) error = 'El código debe tener exactamente 5 caracteres';
  else if (!hasNumber) error = 'El código debe tener al menos 1 número';
  else if (!hasLetter) error = 'El código debe tener al menos 1 letra';
  else if (!noSpecialChars) error = 'El código no debe tener símbolos especiales';

  return {
    isValid,
    hasValidLength,
    hasNumber,
    hasLetter,
    noSpecialChars,
    error
  };
}
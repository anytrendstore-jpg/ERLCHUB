import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WOMPI_CONFIG = {
  integrityKey: process.env.WOMPI_INTEGRITY_KEY || ''
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { reference, amountInCents, currency } = body;

    if (!reference || !amountInCents || !currency) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: reference, amountInCents, currency' },
        { status: 400 }
      );
    }

    const stringToSign = `${reference}${amountInCents}${currency}${WOMPI_CONFIG.integrityKey}`;
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex');

    return NextResponse.json({
      success: true,
      signature
    });

  } catch (error) {
    console.error('Error generando firma:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
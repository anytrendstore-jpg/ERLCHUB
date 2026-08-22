import { NextRequest, NextResponse } from 'next/server';

const WOMPI_CONFIG = {
  publicKey: process.env.WOMPI_PUBLIC_KEY || 'pub_prod_A0BsgOOfJgc719xoHaV5H01lycc8Cvr',
  privateKey: process.env.WOMPI_PRIVATE_KEY || 'prv_prod_ZK5JgQ8fHmN9vPq7rB2x4mE9yR3tK',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.wompi.sv' 
    : 'https://sandbox.wompi.sv'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.transactionId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la transacción' },
        { status: 400 }
      );
    }

    const response = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/transactions/${body.transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WOMPI_CONFIG.privateKey}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    const transaction = await response.json();
    
    return NextResponse.json({
      success: true,
      transaction: transaction,
      status: transaction.data?.status || 'UNKNOWN'
    });

  } catch (error) {
    console.error('Error consultando estado de transacción:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
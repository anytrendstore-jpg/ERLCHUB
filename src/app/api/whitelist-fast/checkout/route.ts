import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, selectedServer = 'los-santos' } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID requerido' 
      }, { status: 400 });
    }

    const reference = `WHITELIST-${selectedServer}-${userId}-${Date.now()}`;
    
    const paymentData = {
      amountInCents: 700, 
      currency: 'COP',
      reference: reference,
      customerData: {
        email: `user_${userId}@erlchub.pro`,
        fullName: `User ${userId}`,
        phoneNumber: '+573000000000',
        legalId: '',
        legalIdType: ''
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_URL}/tienda/whitelist-fast/success?server=${selectedServer}&userId=${userId}`,
      paymentMethods: {
        creditCard: true,
        pse: true,
        nequi: true,
        daviplata: true
      }
    };
    const checkoutUrl = `https://checkout.wompi.co/l/${reference}`;

    return NextResponse.json({
      success: true,
      message: 'Checkout de Whitelist Fast creado',
      checkoutUrl,
      reference,
      amount: 7,
      currency: 'USD',
      selectedServer,
      paymentData
    });

  } catch (error) {
    console.error('Error creando checkout de Whitelist Fast:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
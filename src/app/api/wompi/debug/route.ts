import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const WOMPI_CONFIG = {
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      privateKey: process.env.WOMPI_PRIVATE_KEY,
      baseUrl: process.env.NODE_ENV === 'production' ? 'https://production.wompi.co' : 'https://sandbox.wompi.co'
    };

    const paymentLinkData = {
      name: body.name || 'Pago ERLC HUB',
      description: body.description || 'Compra de Hub Coins o productos',
      single_use: body.single_use || false,
      collect_shipping: false,
      currency: 'COP',
      amount_in_cents: Math.round(body.amount * 100),
      expires_at: body.expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
      redirect_url: body.redirect_url || 'https://www.erlchub.pro/tienda/checkout/success',
      sku: null,
      image_url: null
    };

    const response = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/payment_links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOMPI_CONFIG.privateKey}`
      },
      body: JSON.stringify(paymentLinkData)
    });

    const responseText = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseText: responseText,
      payload: paymentLinkData,
      headers: {
        'Authorization': `Bearer ${WOMPI_CONFIG.privateKey?.substring(0, 10)}...`
      }
    });

  } catch (error) {
    console.error('DEBUG - Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
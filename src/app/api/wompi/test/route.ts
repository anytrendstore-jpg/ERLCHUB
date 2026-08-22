import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const WOMPI_CONFIG = {
      publicKey: process.env.WOMPI_PUBLIC_KEY || 'pub_test_Hl3V675pH555OJ00046aKuYo444sKbta',
      privateKey: process.env.WOMPI_PRIVATE_KEY || 'prv_test_Hl3V675pH555OJ00046aKuYo444sKbta',
      baseUrl: 'https://sandbox.wompi.co'
    };

    console.log('Test Wompi API connectivity:', {
      baseUrl: WOMPI_CONFIG.baseUrl,
      hasPrivateKey: !!WOMPI_CONFIG.privateKey,
      privateKeyLength: WOMPI_CONFIG.privateKey?.length,
      privateKeyPrefix: WOMPI_CONFIG.privateKey?.substring(0, 10) + '...'
    });

    const response = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/payment_links`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WOMPI_CONFIG.privateKey}`
      }
    });

    const responseText = await response.text();
  

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responsePreview: responseText.substring(0, 200),
      config: {
        baseUrl: WOMPI_CONFIG.baseUrl,
        hasPrivateKey: !!WOMPI_CONFIG.privateKey,
        privateKeyLength: WOMPI_CONFIG.privateKey?.length
      }
    });

  } catch (error) {
    console.error('Wompi test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';

const WOMPI_CONFIG = {
  publicKey: process.env.WOMPI_PUBLIC_KEY,
  privateKey: process.env.WOMPI_PRIVATE_KEY,
  baseUrl: process.env.NODE_ENV === 'production' ? 'https://production.wompi.co' : 'https://api-sandbox.wompi.co',
  eventsUrl: process.env.WOMPI_EVENTS_URL || 'https://www.erlchub.pro/api/wompi/events',
  integrityUrl: process.env.WOMPI_INTEGRITY_URL || 'https://www.erlchub.pro/api/wompi/integrity'
};

async function getAcceptanceToken() {
  try {
    const response = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/merchants/${WOMPI_CONFIG.publicKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error obteniendo acceptance token');
    }

    const data = await response.json();
    return data.data?.presigned_acceptance?.acceptance_token;
  } catch (error) {
    console.error('Error obteniendo acceptance token:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const merchantRes = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/merchants/${WOMPI_CONFIG.publicKey}`);
    const merchantData = await merchantRes.json();
    const acceptanceToken = merchantData.data.presigned_acceptance.acceptance_token;
    const tasaCambio = 4000; 
    const amountInCents = Math.round(body.amount * tasaCambio * 100);

    const paymentLinkData = {
      name: body.name || 'Pago ERLC HUB',
      description: body.description || 'Compra de Hub Coins/Productos en ERLC HUB',
      single_use: true,
      collect_shipping: false,
      currency: 'COP',
      amount_in_cents: amountInCents,
      expires_at: new Date(Date.now() + 86400000).toISOString(), 
      redirect_url: 'https://erlchub.pro',
      acceptance_token: acceptanceToken
    };

    const response = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/payment_links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOMPI_CONFIG.privateKey}` 
      },
      body: JSON.stringify(paymentLinkData)
    });

    const paymentLink = await response.json();

    if (!response.ok) {
      console.error('Error de Wompi:', paymentLink);
      return NextResponse.json({ error: 'Error Wompi', details: paymentLink }, { status: 400 });
    }

    const linkId = paymentLink.data?.id;

    const checkoutUrl = linkId ? `https://wompi.co/${linkId}` : undefined;

    console.log('URL construida manualmente:', checkoutUrl);

    return NextResponse.json({
      success: true,
      payment_link: paymentLink,
      checkout_url: checkoutUrl 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del link de pago' },
        { status: 400 }
      );
    }

    const response = await fetch(`${WOMPI_CONFIG.baseUrl}/v1/links/${linkId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WOMPI_CONFIG.privateKey}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Link de pago no encontrado' },
        { status: 404 }
      );
    }

    const paymentLink = await response.json();
    
    return NextResponse.json({
      success: true,
      payment_link: paymentLink
    });

  } catch (error) {
    console.error('Error obteniendo link de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
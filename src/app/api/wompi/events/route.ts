import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { memberships } from '@/lib/shopData';

const WOMPI_CONFIG = {
  publicKey: process.env.WOMPI_PUBLIC_KEY || 'pub_prod_A0BsgOOfJgc719xoHaV5H01lycc8Cvr',
  privateKey: process.env.WOMPI_PRIVATE_KEY || 'prv_prod_ZK5JgQ8fHmN9vPq7rB2x4mE9yR3tK',
  eventsKey: process.env.WOMPI_EVENTS_KEY || 'prod_events_5aFXDbV4GdrRGTXC3g162qef81uCz8qO',
  integrityKey: process.env.WOMPI_INTEGRITY_KEY || 'prod_integrity_4raQGWFNxOKPr5giSG8CcqRel3jbEyyD'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const signature = request.headers.get('x-wompi-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Firma no encontrada' }, { status: 401 });
    }

    const bodyString = JSON.stringify(body);
    
    const computedSignature = crypto
      .createHmac('sha256', WOMPI_CONFIG.integrityKey)
      .update(bodyString)
      .digest('hex');

    if (computedSignature !== signature) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const { event, data } = body;

    switch (event) {
      case 'payment.created':
        break;
        
      case 'payment.updated':
        console.log('Pago actualizado:', data);
        break;
        
      case 'payment.approved':
        await handleApprovedPayment(data);
        break;
        
      case 'payment.rejected':
        break;
        
      case 'payment.error':
        break;
      default: 
        console.log('', event);
    }

    async function handleApprovedPayment(paymentData: any) {
      try {
        const db = await connectToDatabase();
        const { reference, amount_in_cents, customer_email } = paymentData;
        
        if (reference.startsWith('membership-')) {
          const membershipId = reference.replace('membership-', '');
          const membership = memberships.find(m => m.id === membershipId);
          
          if (membership) {
            const user = await db.collection('users').findOne({ email: customer_email });
            
            if (user) {
              await db.collection('users').updateOne(
                { _id: user._id },
                { 
                  $set: { 
                    membership: {
                      id: membership.id,
                      name: membership.name,
                      type: 'permanent', 
                      purchasedAt: new Date().toISOString(),
                      expiresAt: null 
                    }
                  },
                  $push: {
                    transactions: {
                      type: 'membership_purchase',
                      amount: amount_in_cents / 100,
                      description: `Compra de membresía: ${membership.name}`,
                      timestamp: new Date().toISOString(),
                      status: 'completed',
                      metadata: {
                        membershipId: membership.id,
                        membershipName: membership.name
                      }
                    }
                  }
                }
              );

              try {
                const botResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://www.erlchub.pro'}/api/discord-bot/deliver-membership`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.discordId,
                    membershipId: membership.id,
                    membershipName: membership.name,
                    membershipType: 'permanent',
                    membershipPrice: amount_in_cents / 100,
                    serverId: '1432194616224120916', 
                    transactionId: paymentData.id,
                    benefits: membership.benefits || [],
                    roleIds: [
                      '',
                      '', 
                      '' 
                    ]
                  })
                });

                const botResult = await botResponse.json();
                
                if (botResult.success) {
                } else {
                  console.error(`Error entregando membresía ${membership.name}:`, botResult.error);
                }
              } catch (botError) {
                console.error('Error en integración con bot de Discord:', botError);
              }
            }
          }
        } else if (reference.startsWith('hubcoins-')) {
        }
      } catch (error) {
        console.error('Error procesando pago aprobado:', error);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Error procesando evento de Wompi:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
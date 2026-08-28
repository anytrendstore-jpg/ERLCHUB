import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { chargePaymentSource } from '@/lib/wompiServer';
import { createOrder } from '@/lib/shopOrdersServer';

export async function POST(request: NextRequest) {
  try {
    const { action = 'check' } = await request.json();

    const db = await connectToDatabase();

    if (action === 'check') {
      return await checkAndSendReminders(db);
    } else if (action === 'send_manual') {
      const { userId, membershipId } = await request.json();
      return await sendManualReminder(userId, membershipId, db);
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error en sistema de recordatorios:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function checkAndSendReminders(db: any) {
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  try {
    const expiringSoon = await db.collection('membership_subscriptions')
      .find({
        status: 'active',
        membershipType: 'monthly', 
        endDate: { $lte: fiveDaysFromNow, $gt: now },
        reminderSent: false
      })
      .toArray();


    const remindersSent = [];

    for (const subscription of expiringSoon) {
      try {
        const reminderResult = await sendReminderToUser(subscription);
        
        if (reminderResult.success) {
          await db.collection('membership_subscriptions').updateOne(
            { _id: subscription._id },
            { $set: { reminderSent: true, lastReminderDate: now } }
          );

          remindersSent.push({
            userId: subscription.userId,
            membershipName: subscription.membershipName,
            daysUntilExpiry: Math.ceil((subscription.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      } catch (error) {
        console.error(`Error sending reminder to ${subscription.userId}:`, error);
      }
    }

    // Vencen HOY (o ya vencieron) y tienen tarjeta guardada: se cobran solas, antes de bajar a
    // 'expired' — el resultado real (aprobado/rechazado) llega después por el webhook de Wompi,
    // que extiende la suscripción o dispara el reintento (ver recordFailedRenewal).
    const dueForRenewal = await db.collection('membership_subscriptions')
      .find({
        status: 'active',
        membershipType: 'monthly',
        autoRenew: true,
        nextPaymentDate: { $lte: now },
        paymentSourceId: { $exists: true },
        $or: [{ nextRetryAt: { $exists: false } }, { nextRetryAt: { $lte: now } }],
      })
      .toArray();

    let renewalsAttempted = 0;
    for (const subscription of dueForRenewal) {
      try {
        await attemptAutoRenewal(subscription);
        renewalsAttempted++;
      } catch (error) {
        console.error(`Error disparando renovación automática para ${subscription.userId}:`, error);
      }
    }

    // Vencidas SIN auto-renovación (o que ya agotaron sus 3 reintentos y el webhook las marcó
    // 'expired') — se les avisa, pero no se cobra nada más.
    const expired = await db.collection('membership_subscriptions')
      .find({
        status: 'expired',
        membershipType: 'monthly',
        autoRenew: false,
      })
      .toArray();

    for (const subscription of expired) {
      try {
        await sendRenewalNotification(subscription);
      } catch (error) {
        console.error(`Error notificando expiración a ${subscription.userId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Proceso de recordatorios completado',
      stats: {
        expiringSoonFound: expiringSoon.length,
        remindersSent: remindersSent.length,
        renewalsAttempted,
        expiredNotified: expired.length
      },
      remindersSent
    });

  } catch (error) {
    console.error('Error en checkAndSendReminders:', error);
    throw error;
  }
}

async function sendReminderToUser(subscription: any) {
  try {
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN no configurado');
    }

    const dmChannelResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: subscription.userId
      })
    });

    if (!dmChannelResponse.ok) {
      throw new Error('No se pudo crear canal DM');
    }

    const dmChannel = await dmChannelResponse.json();
    const channelId = dmChannel.id;
    const paymentLink = await generatePaymentLink(subscription);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const reminderMessage = {
      content: `**${subscription.membershipName} - Recordatorio de Renovación**`,
      embeds: [{
        title: `¡Tu membresía ${subscription.membershipName} vence en ${daysUntilExpiry} días!`,
        description: `Para seguir disfrutando de todos los beneficios de tu membresía, renuévala antes de que venza.`,
        color: 0xff9900, 
        fields: [
          {
            name: 'Membresía Actual',
            value: subscription.membershipName,
            inline: true
          },
          {
            name: 'Tipo',
            value: subscription.membershipType === 'monthly' ? 'Mensual' : 'Permanente',
            inline: true
          },
          {
            name: 'Fecha de Vencimiento',
            value: subscription.endDate.toLocaleDateString('es-CO'),
            inline: true
          },
          {
            name: 'Precio de Renovación',
            value: `$${subscription.renewalPrice} USD`,
            inline: true
          },
          {
            name: 'Beneficios en Riesgo',
            value: subscription.benefits.slice(0, 3).map((b: string) => `:x: ${b}`).join('\n') + 
                  (subscription.benefits.length > 3 ? `\n... y ${subscription.benefits.length - 3} más` : ''),
            inline: false
          }
        ],
        footer: {
          text: 'ERLC HUB',
          icon_url: 'https://www.erlchub.pro/hub-coins.png'
        },
        timestamp: new Date().toISOString()
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Renovar Ahora',
              url: paymentLink
            },
            {
              type: 2,
              style: 5,
              label: 'Ver Todas las Membresías',
              url: 'https://www.erlchub.pro/tienda/membresia'
            }
          ]
        }
      ]
    };

    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reminderMessage)
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      throw new Error(`Error enviando mensaje: ${error}`);
    }

    return { success: true, messageId: (await messageResponse.json()).id };

  } catch (error) {
    console.error('Error enviando recordatorio:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

async function generatePaymentLink(subscription: any): Promise<string> {
  try {
    const reference = `RENEWAL-${subscription.membershipId}-${subscription.userId}-${Date.now()}`;
    const paymentData = {
      amountInCents: Math.round(subscription.renewalPrice * 100),
      currency: 'COP',
      reference: reference,
      redirectUrl: `https://www.erlchub.pro/api/memberships/renewal-success?userId=${subscription.userId}&membershipId=${subscription.membershipId}`,
    };

    return `https://checkout.wompi.co/l/${reference}`;
    
  } catch (error) {
    console.error('Error generando enlace de pago:', error);
    return 'https://www.erlchub.pro/tienda/membresia';
  }
}

/**
 * Cobra la renovación de una suscripción usando el payment_source_id guardado — sin que el
 * usuario esté presente. Solo confirma que Wompi aceptó CREAR el intento de cobro; el resultado
 * real (aprobado o rechazado) llega después por el webhook (src/app/api/wompi/events/route.ts),
 * que es quien realmente extiende la suscripción o dispara el reintento.
 */
async function attemptAutoRenewal(subscription: any) {
  try {
    if (!subscription.paymentSourceId) {
      return { success: false, reason: 'Sin método de pago guardado' };
    }

    const amountInCents = Math.round(subscription.renewalPrice * 4000 * 100); // mismo tipo de cambio fijo USD->COP que el resto del checkout (Fase C)
    const reference = `ERLC_RENEWAL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const customerEmail = `user_${subscription.userId}@erlchub.pro`;

    await createOrder({
      reference,
      discordId: subscription.userId,
      items: [{
        catalogId: subscription.membershipId,
        type: 'membership',
        name: subscription.membershipName,
        quantity: 1,
        unitPriceUSD: subscription.renewalPrice,
        paymentType: 'monthly',
      }],
      amountUSD: subscription.renewalPrice,
      amountInCents,
      paymentSourceId: subscription.paymentSourceId,
      isRenewal: true,
    });

    await chargePaymentSource({
      paymentSourceId: subscription.paymentSourceId,
      amountInCents,
      reference,
      customerEmail,
    });

    return { success: true, reference };
  } catch (error) {
    console.error('Error en auto-renewal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

async function sendRenewalNotification(subscription: any) {
  try {
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN no configurado');
    }

    const dmChannelResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: subscription.userId
      })
    });

    if (!dmChannelResponse.ok) {
      throw new Error('No se pudo crear canal DM');
    }

    const dmChannel = await dmChannelResponse.json();
    const channelId = dmChannel.id;
    const paymentLink = await generatePaymentLink(subscription);
    const renewalMessage = {
      content: `**${subscription.membershipName} - Membresía Expirada**`,
      embeds: [{
        title: `¡Tu membresía ${subscription.membershipName} ha expirado!`,
        description: `Tus beneficios han sido desactivados. Renueva tu membresía para seguir disfrutando de todas las ventajas.`,
        color: 0xff0000,
        fields: [
          {
            name: 'Membresía',
            value: subscription.membershipName,
            inline: true
          },
          {
            name: 'Estado',
            value: 'Expirada',
            inline: true
          },
          {
            name: 'Precio de Renovación',
            value: `$${subscription.renewalPrice} USD`,
            inline: true
          },
          {
            name: 'Beneficios Perdidos',
            value: subscription.benefits.map((b: string) => `:x: ${b}`).join('\n'),
            inline: false
          }
        ],
        footer: {
          text: 'ERLC HUB',
          icon_url: 'https://www.erlchub.pro/hub-coins.png'
        },
        timestamp: new Date().toISOString()
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Renovar Ahora',
              url: paymentLink
            },
            {
              type: 2,
              style: 5,
              label: 'Ver Otras Membresías',
              url: 'https://www.erlchub.pro/tienda/membresia'
            }
          ]
        }
      ]
    };

    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(renewalMessage)
    });

    return { success: true };

  } catch (error) {
    console.error('Error enviando notificación de renovación:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

async function sendManualReminder(userId: string, membershipId: string, db: any) {
  try {
    const subscription = await db.collection('membership_subscriptions')
      .findOne({ userId, membershipId, status: 'active' });

    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Suscripción no encontrada' 
      }, { status: 404 });
    }

    const result = await sendReminderToUser(subscription);
    
    if (result.success) {
      await db.collection('membership_subscriptions').updateOne(
        { _id: subscription._id },
        { $set: { reminderSent: true, lastReminderDate: new Date() } }
      );
    }

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Recordatorio enviado manualmente' : 'Error enviando recordatorio'
    });

  } catch (error) {
    console.error('Error enviando recordatorio manual:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
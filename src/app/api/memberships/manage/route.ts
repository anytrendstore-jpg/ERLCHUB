import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { memberships } from '@/lib/shopData';

interface MembershipSubscription {
  userId: string;
  membershipId: string;
  membershipName: string;
  membershipType: 'monthly' | 'permanent';
  status: 'active' | 'expired' | 'cancelled' | 'pending_renewal';
  startDate: Date;
  endDate: Date | null; 
  lastPaymentDate: Date;
  nextPaymentDate: Date | null; 
  autoRenew: boolean;
  renewalPrice: number;
  transactionId?: string;
  benefits: string[];
  roleIds: string[];
  serverId: string;
  reminderSent: boolean; 
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      membershipId, 
      membershipType, 
      autoRenew = true,
      transactionId 
    } = await request.json();

    if (!userId || !membershipId || !membershipType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para la suscripción' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    const membership = memberships.find(m => m.id === membershipId);
    if (!membership) {
      return NextResponse.json({ 
        success: false, 
        error: 'Membresía no encontrada' 
      }, { status: 404 });
    }

    const now = new Date();
    const price = membershipType === 'monthly' ? membership.priceMonthly : membership.pricePermanent;
    const endDate = membershipType === 'monthly' 
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
    
    const nextPaymentDate = membershipType === 'monthly'
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) 
      : null;

    const subscription: MembershipSubscription = {
      userId,
      membershipId,
      membershipName: membership.name,
      membershipType,
      status: 'active',
      startDate: now,
      endDate,
      lastPaymentDate: now,
      nextPaymentDate,
      autoRenew,
      renewalPrice: price,
      transactionId,
      benefits: membership.benefits,
      roleIds: [], 
      serverId: process.env.DISCORD_SERVER_ID || '',
      reminderSent: false
    };

    await db.collection('membership_subscriptions').insertOne(subscription);

    await db.collection('users').updateOne(
      { discordId: userId },
      { 
        $set: { 
          membership: {
            id: membershipId,
            name: membership.name,
            type: membershipType,
            status: 'active',
            startDate: now,
            endDate,
            autoRenew,
            benefits: membership.benefits
          }
        }
      },
      { upsert: true }
    );

    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/discord-bot/deliver-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          membershipId,
          membershipName: membership.name,
          membershipType,
          membershipPrice: price,
          serverId: subscription.serverId,
          transactionId,
          benefits: membership.benefits,
          roleIds: subscription.roleIds
        })
      });
    } catch (discordError) {
      console.error('Error entregando membresía en Discord:', discordError);
    }

    return NextResponse.json({
      success: true,
      message: 'Membresía activada exitosamente',
      subscription: {
        ...subscription,
        _id: 'generated-id'
      }
    });

  } catch (error) {
    console.error('Error en suscripción de membresía:', error);
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

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID requerido' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    const subscription = await db.collection('membership_subscriptions')
      .findOne({ userId, status: 'active' });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'No hay membresía activa'
      });
    }
    const now = new Date();
    let status = subscription.status;

    if (subscription.membershipType === 'monthly' && subscription.endDate && now > subscription.endDate) {
      status = 'expired';
      
      await db.collection('membership_subscriptions').updateOne(
        { userId, _id: subscription._id },
        { $set: { status: 'expired' } }
      );

      await db.collection('users').updateOne(
        { discordId: userId },
        { $set: { 'membership.status': 'expired' } }
      );

      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/discord-bot/revoke-membership`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            membershipId: subscription.membershipId,
            reason: 'Membresía mensual expirada'
          })
        });
      } catch (discordError) {
        console.error('Error revocando membresía en Discord:', discordError);
      }
    }
    
    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        status,
        daysUntilExpiration: subscription.endDate 
          ? Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        needsRenewal: status === 'expired' || (subscription.membershipType === 'monthly' && subscription.endDate && 
          Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 5)
      }
    });

  } catch (error) {
    console.error('Error obteniendo membresía:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
      case 'renew':
        return await renewMembership(userId, data, db);
      
      case 'cancel':
        return await cancelMembership(userId, db);
      
      case 'toggle_auto_renew':
        return await toggleAutoRenew(userId, data.autoRenew, db);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Acción no válida' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error actualizando membresía:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function renewMembership(userId: string, data: any, db: any) {
  const { transactionId, paymentMethod = 'wompi' } = data;
  const subscription = await db.collection('membership_subscriptions')
    .findOne({ userId, status: { $in: ['expired', 'active'] } });

  if (!subscription) {
    return NextResponse.json({ 
      success: false, 
      error: 'No se encontró suscripción para renovar' 
    }, { status: 404 });
  }

  const now = new Date();
  const newEndDate = subscription.membershipType === 'monthly'
    ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  
  const newNextPaymentDate = subscription.membershipType === 'monthly'
    ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  await db.collection('membership_subscriptions').updateOne(
    { userId, _id: subscription._id },
    {
      $set: {
        status: 'active',
        startDate: now,
        endDate: newEndDate,
        lastPaymentDate: now,
        nextPaymentDate: newNextPaymentDate,
        transactionId,
        reminderSent: false
      }
    }
  );

  await db.collection('users').updateOne(
    { discordId: userId },
    {
      $set: {
        'membership.status': 'active',
        'membership.startDate': now,
        'membership.endDate': newEndDate
      }
    }
  );

  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/discord-bot/deliver-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        membershipId: subscription.membershipId,
        membershipName: subscription.membershipName,
        membershipType: subscription.membershipType,
        membershipPrice: subscription.renewalPrice,
        serverId: subscription.serverId,
        transactionId,
        benefits: subscription.benefits,
        roleIds: subscription.roleIds
      })
    });
  } catch (discordError) {
    console.error('Error reactivando membresía en Discord:', discordError);
  }

  return NextResponse.json({
    success: true,
    message: 'Membresía renovada exitosamente',
    subscription: {
      ...subscription,
      status: 'active',
      endDate: newEndDate,
      nextPaymentDate: newNextPaymentDate
    }
  });
}

async function cancelMembership(userId: string, db: any) {
  try {
    const subscription = await db.collection('membership_subscriptions')
      .findOne({ userId, status: 'active' });

    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se encontró una membresía activa para cancelar' 
      }, { status: 404 });
    }

    await db.collection('membership_subscriptions').updateOne(
      { userId, _id: subscription._id, status: 'active' },
      { 
        $set: { 
          status: 'cancelled',
          autoRenew: false,
          cancelledAt: new Date(),
          endDate: new Date() 
        } 
      }
    );

    await db.collection('users').updateOne(
      { discordId: userId },
      { 
        $set: { 
          'membership.status': 'cancelled',
          'membership.endDate': new Date(),
          'membership.cancelledAt': new Date()
        } 
      }
    );

    try {
      const revokeResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/discord-bot/revoke-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          membershipId: subscription.membershipId,
          reason: `Membresía ${subscription.membershipType} cancelada por el usuario`
        })
      });

      if (!revokeResponse.ok) {
        console.error('Error revocando membresía en Discord:', await revokeResponse.text());
      }
    } catch (discordError) {
      console.error('Error revocando membresía en Discord:', discordError);
    }

    try {
      await sendCancellationNotification(userId, subscription);
    } catch (notificationError) {
      console.error('Error enviando notificación de cancelación:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Membresía cancelada exitosamente. Todos los beneficios han sido revocados.',
      cancelledAt: new Date(),
      membershipType: subscription.membershipType
    });

  } catch (error) {
    console.error('Error en cancelMembership:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function sendCancellationNotification(userId: string, subscription: any) {
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
        recipient_id: userId
      })
    });

    if (!dmChannelResponse.ok) {
      throw new Error('No se pudo crear canal DM');
    }

    const dmChannel = await dmChannelResponse.json();
    const channelId = dmChannel.id;

    const cancellationMessage = {
      content: `**Membresía Cancelada**`,
      embeds: [{
        title: `Tu membresía ${subscription.membershipName} ha sido cancelada`,
        description: `Has cancelado tu membresía ${subscription.membershipType === 'permanent' ? 'permanente' : 'mensual'}. Todos los beneficios han sido revocados inmediatamente.`,
        color: 0xff0000, 
        fields: [
          {
            name: 'Membresía',
            value: subscription.membershipName,
            inline: true
          },
          {
            name: 'Tipo',
            value: subscription.membershipType === 'permanent' ? 'Permanente' : 'Mensual',
            inline: true
          },
          {
            name: 'Fecha de Cancelación',
            value: new Date().toLocaleString('es-CO'),
            inline: true
          },
          {
            name: 'Beneficios Perdidos',
            value: subscription.benefits.slice(0, 3).map((b: string) => `:x: ${b}`).join('\n') + 
                  (subscription.benefits.length > 3 ? `\n... y ${subscription.benefits.length - 3} más` : ''),
            inline: false
          },
          {
            name: '¿Qué hacer ahora?',
            value: 'Si cambias de opinión, puedes comprar una nueva membresía en cualquier momento desde la tienda.',
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
              label: 'Comprar Nueva Membresía',
              url: 'https://www.erlchub.pro/tienda/membresia'
            },
            {
              type: 2,
              style: 5,
              label: 'Contactar Soporte',
              url: 'https://discord.gg/xKJqNX7uC3'
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
      body: JSON.stringify(cancellationMessage)
    });

    return { success: true };

  } catch (error) {
    console.error('Error enviando notificación de cancelación:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

async function toggleAutoRenew(userId: string, autoRenew: boolean, db: any) {
  await db.collection('membership_subscriptions').updateOne(
    { userId, status: 'active' },
    { $set: { autoRenew } }
  );

  return NextResponse.json({
    success: true,
    message: `Renovación automática ${autoRenew ? 'activada' : 'desactivada'}`
  });
}
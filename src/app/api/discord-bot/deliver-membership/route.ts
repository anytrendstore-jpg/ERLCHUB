import { NextRequest, NextResponse } from 'next/server';

interface DiscordMembershipRequest {
  userId: string;
  membershipId: string;
  membershipName: string;
  membershipType: 'monthly' | 'permanent';
  membershipPrice: number;
  serverId: string;
  transactionId?: string;
  benefits: string[];
  roleIds: string[]; 
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      membershipId, 
      membershipName, 
      membershipType, 
      membershipPrice,
      serverId, 
      transactionId,
      benefits,
      roleIds
    }: DiscordMembershipRequest = await request.json();

    if (!userId || !membershipId || !membershipName || !serverId || !benefits || !roleIds) {
      return NextResponse.json({ success: false, error: 'Datos incompletos para la entrega de membresía' }, { status: 400 });
    }

    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN no encontrado en variables de entorno');
      return NextResponse.json({ success: false, error: 'Configuración del bot no disponible' }, { status: 500 });
    }

    const sendToBot = async (action: string, data: any) => {
      try {
        const response = await fetch(`https://discord.com/api/v10/channels/${process.env.BOT_CHANNEL_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `**${action}**`,
            embeds: [{
              title: `Entrega de Membresía - ${membershipName}`,
              description: `Usuario: <@${userId}> (${userId})`,
              fields: [
                {
                  name: '👑 Membresía',
                  value: membershipName,
                  inline: true
                },
                {
                  name: '🎮 Servidor',
                  value: serverId,
                  inline: true
                },
                {
                  name: '⏰ Tipo',
                  value: membershipType === 'monthly' ? 'Mensual' : 'Permanente',
                  inline: true
                },
                {
                  name: '💰 Precio',
                  value: `$${membershipPrice} USD`,
                  inline: true
                },
                {
                  name: '🎁 Beneficios',
                  value: benefits.map(benefit => `• ${benefit}`).join('\n'),
                  inline: false
                },
                {
                  name: '🔐 Roles a Asignar',
                  value: roleIds.map(roleId => `\`${roleId}\``).join(', '),
                  inline: false
                },
                {
                  name: '🆔 Transacción',
                  value: transactionId || 'N/A',
                  inline: true
                },
                {
                  name: '⏰ Fecha',
                  value: new Date().toLocaleString('es-CO'),
                  inline: true
                }
              ],
              color: 0xffd700, // Color dorado para membresías
              timestamp: new Date().toISOString()
            }]
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Error enviando mensaje al bot:', error);
          throw new Error('Error comunicándose con el bot de Discord');
        }

        return await response.json();
      } catch (error) {
        console.error('Error en sendToBot:', error);
        throw error;
      }
    };

    const botResponse = await sendToBot('ENTREGAR_MEMBRESIA', {
      userId,
      membershipId,
      membershipName,
      membershipType,
      membershipPrice,
      serverId,
      transactionId,
      benefits,
      roleIds
    });

    const sendDMToUser = async () => {
      try {
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
          throw new Error('No se pudo crear canal DM con el usuario');
        }

        const dmChannel = await dmChannelResponse.json();
        const channelId = dmChannel.id;

        const comprobanteMessage = {
          content: `**👑 ¡Membresía Activada Exitosamente!**`,
          embeds: [{
            title: `Comprobante de Membresía - ${membershipName}`,
            description: `Tu membresía ha sido activada en el servidor de Los Santos.`,
            fields: [
              {
                name: '🎁 Membresía Adquirida',
                value: membershipName,
                inline: true
              },
              {
                name: '🎮 Servidor',
                value: 'Los Santos',
                inline: true
              },
              {
                name: '⏰ Duración',
                value: membershipType === 'monthly' ? '30 días' : 'Permanente',
                inline: true
              },
              {
                name: '🎯 Beneficios Activados',
                value: benefits.map(benefit => `✅ ${benefit}`).join('\n'),
                inline: false
              },
              {
                name: '🔐 Roles Asignados',
                value: `${roleIds.length} roles asignados`,
                inline: true
              },
              {
                name: '🆔 ID de Transacción',
                value: transactionId || 'N/A',
                inline: true
              },
              {
                name: '⏰ Fecha de Activación',
                value: new Date().toLocaleString('es-CO'),
                inline: true
              }
            ],
            color: 0xffd700, 
            footer: {
              text: 'ERLC HUB - Sistema de Membresías',
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
                  label: '🌐 Ir a la Tienda',
                  url: 'https://www.erlchub.pro/tienda'
                },
                {
                  type: 2,
                  style: 5,
                  label: '👤 Ver Perfil',
                  url: 'https://www.erlchub.pro/perfil'
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
          body: JSON.stringify(comprobanteMessage)
        });

        if (!messageResponse.ok) {
          const error = await messageResponse.text();
          console.error('Error enviando DM al usuario:', error);
          throw new Error('Error enviando comprobante al usuario');
        }

        return await messageResponse.json();
      } catch (error) {
        console.error('Error en sendDMToUser:', error);
        throw error;
      }
    };

    await new Promise(resolve => setTimeout(resolve, 2000));
    const dmResponse = await sendDMToUser();

    return NextResponse.json({
      success: true,
      message: 'Membresía entregada y comprobante enviado',
      botResponse,
      dmResponse,
      deliveryDetails: {
        userId,
        membershipId,
        membershipName,
        membershipType,
        serverId,
        deliveredAt: new Date().toISOString(),
        transactionId,
        benefits,
        roleIds
      }
    });

  } catch (error) {
    console.error('Error en entrega de membresía:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
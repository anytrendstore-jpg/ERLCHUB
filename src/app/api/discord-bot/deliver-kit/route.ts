import { NextRequest, NextResponse } from 'next/server';

interface DiscordBotRequest {
  userId: string;
  kitName: string;
  kitItems: string[];
  serverId: string;
  transactionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, kitName, kitItems, serverId, transactionId }: DiscordBotRequest = await request.json();

    if (!userId || !kitName || !kitItems || !serverId) {
      return NextResponse.json({ success: false, error: 'Datos incompletos para la entrega del kit' }, { status: 400 });
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
              title: `Entrega de Kit - ${kitName}`,
              description: `Usuario: <@${userId}> (${userId})`,
              fields: [
                {
                  name: '📦 Kit',
                  value: kitName,
                  inline: true
                },
                {
                  name: '🎮 Servidor',
                  value: serverId,
                  inline: true
                },
                {
                  name: '📋 Items del Kit',
                  value: kitItems.map(item => `• ${item}`).join('\n'),
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
              color: 0x00ff00,
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

    const botResponse = await sendToBot('ENTREGAR_KIT', {
      userId,
      kitName,
      kitItems,
      serverId,
      transactionId
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
          content: `**✅ ¡Kit Entregado Exitosamente!**`,
          embeds: [{
            title: `Comprobante de Entrega - ${kitName}`,
            description: `Tu kit ha sido entregado en el servidor de Los Santos.`,
            fields: [
              {
                name: '🎁 Kit Adquirido',
                value: kitName,
                inline: true
              },
              {
                name: '🎮 Servidor',
                value: 'Los Santos',
                inline: true
              },
              {
                name: '📋 Items Recibidos',
                value: kitItems.map(item => `✅ ${item}`).join('\n'),
                inline: false
              },
              {
                name: '🆔 ID de Transacción',
                value: transactionId || 'N/A',
                inline: true
              },
              {
                name: '⏰ Fecha de Entrega',
                value: new Date().toLocaleString('es-CO'),
                inline: true
              }
            ],
            color: 0x00ff00,
            footer: {
              text: 'ERLC HUB - Sistema de Kits',
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
      message: 'Kit entregado y comprobante enviado',
      botResponse,
      dmResponse,
      deliveryDetails: {
        userId,
        kitName,
        kitItems,
        serverId,
        deliveredAt: new Date().toISOString(),
        transactionId
      }
    });

  } catch (error) {
    console.error('Error en entrega de kit:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
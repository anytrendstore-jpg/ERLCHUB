import { NextRequest, NextResponse } from 'next/server';

interface DiscordRevokeRequest {
  userId: string;
  membershipId: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipId, reason }: DiscordRevokeRequest = await request.json();

    if (!userId || !membershipId || !reason) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para la revocación de membresía' 
      }, { status: 400 });
    }

    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN no encontrado en variables de entorno');
      return NextResponse.json({ 
        success: false, 
        error: 'Configuración del bot no disponible' 
      }, { status: 500 });
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
              title: `Revocación de Membresía - ${membershipId}`,
              description: `Usuario: <@${userId}> (${userId})`,
              fields: [
                {
                  name: 'Usuario',
                  value: `<@${userId}> (${userId})`,
                  inline: true
                },
                {
                  name: 'Membresía',
                  value: membershipId,
                  inline: true
                },
                {
                  name: 'Razón',
                  value: reason,
                  inline: true
                },
                {
                  name: 'Fecha',
                  value: new Date().toLocaleString('es-CO'),
                  inline: true
                }
              ],
              color: 0xff0000,
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

    const botResponse = await sendToBot('REVOCAR_MEMBRESIA', {
      userId,
      membershipId,
      reason
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

        const notificationMessage = {
          content: `**Membresía Revocada**`,
          embeds: [{
            title: `Tu membresía ha sido revocada`,
            description: `Tu membresía ha sido desactivada por la siguiente razón: ${reason}`,
            fields: [
              {
                name: 'Membresía',
                value: membershipId,
                inline: true
              },
              {
                name: 'Razón',
                value: reason,
                inline: true
              },
              {
                name: 'Fecha',
                value: new Date().toLocaleString('es-CO'),
                inline: true
              },
              {
                name: '¿Qué hacer?',
                value: 'Si crees que esto es un error, contacta al soporte o considera renovar tu membresía.',
                inline: false
              }
            ],
            color: 0xff0000, 
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
                  label: 'Renovar Membresía',
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

        const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationMessage)
        });

        if (!messageResponse.ok) {
          const error = await messageResponse.text();
          console.error('Error enviando DM al usuario:', error);
          throw new Error('Error enviando notificación al usuario');
        }

        return await messageResponse.json();
      } catch (error) {
        console.error('Error en sendDMToUser:', error);
        throw error;
      }
    };

    const dmResponse = await sendDMToUser();

    return NextResponse.json({
      success: true,
      message: 'Membresía revocada y notificación enviada',
      botResponse,
      dmResponse,
      revocationDetails: {
        userId,
        membershipId,
        reason,
        revokedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en revocación de membresía:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';

interface DiscordWhitelistFastRequest {
  userId: string;
  transactionId: string;
  selectedServer: string;
  kitName: string;
  items: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      transactionId, 
      selectedServer, 
      kitName, 
      items 
    }: DiscordWhitelistFastRequest = await request.json();

    if (!userId || !transactionId || !selectedServer || !kitName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para la entrega de Whitelist Fast' 
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
              title: `Entrega de Whitelist Fast - ${kitName}`,
              description: `Usuario: <@${userId}> (${userId})`,
              fields: [
                {
                  name: 'Usuario',
                  value: `<@${userId}> (${userId})`,
                  inline: true
                },
                {
                  name: 'Servidor Seleccionado',
                  value: getServerName(selectedServer),
                  inline: true
                },
                {
                  name: 'Kit',
                  value: kitName,
                  inline: true
                },
                {
                  name: 'Transacción',
                  value: transactionId,
                  inline: true
                },
                {
                  name: 'Beneficios',
                  value: items.map((item: string) => `> ${item}`).join('\n'),
                  inline: false
                },
                {
                  name: 'Fecha',
                  value: new Date().toLocaleString('es-CO'),
                  inline: true
                }
              ],
              color: 0x8b5cf6, 
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

    const botResponse = await sendToBot('ENTREGAR_WHITELIST_FAST', {
      userId,
      transactionId,
      selectedServer,
      kitName,
      items
    });

    const sendServerSelectionDM = async () => {
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

        const selectionMessage = {
          content: `**${getServerEmoji(selectedServer)} Elige tu servidor preferido:**`,
          embeds: [getServerEmbed(selectedServer)],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: `Unirse a ${getServerName(selectedServer)}`,
                  url: getServerInvite(selectedServer)
                },
                {
                  type: 2,
                  style: 5,
                  label: 'Ver Todos los Servidores',
                  url: 'https://www.erlchub.pro/servidores'
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
          body: JSON.stringify(selectionMessage)
        });

        if (!messageResponse.ok) {
          const error = await messageResponse.text();
          console.error('Error enviando DM al usuario:', error);
          throw new Error('Error enviando selección de servidor al usuario');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        const successMessage = {
          content: `**${getServerEmoji(selectedServer)} ¡Whitelist Fast Exitosa!**`,
          embeds: [{
            title: `¡Tu Whitelist Fast fue satisfactoriamente exitosa!`,
            description: `Ya tienes acceso inmediato al servidor de ${getServerName(selectedServer)} sin necesidad de entrevistas o pruebas.`,
            color: 0x00ff00, 
            fields: [
              {
                name: 'Servidor',
                value: `${getServerEmoji(selectedServer)} ${getServerName(selectedServer)}`,
                inline: true
              },
              {
                name: 'Estado',
                value: 'Activo',
                inline: true
              },
              {
                name: 'Acceso',
                value: 'Inmediato',
                inline: true
              },
              {
                name: 'Beneficios Activados',
                value: items.map((item: string) => `> ${item}`).join('\n'),
                inline: false
              },
              {
                name: 'Próximos Pasos',
                value: '1. Únete al servidor usando el enlace\n2. Crea tu personaje\n3. ¡Comienza a rolear inmediatamente!',
                inline: false
              }
            ],
            footer: {
              text: 'ERLC HUB - Whitelist Fast System',
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
                  label: 'Unirse al Servidor',
                  url: getServerInvite(selectedServer)
                },
                {
                  type: 2,
                  style: 5,
                  label: 'Tienda ERLC HUB',
                  url: 'https://www.erlchub.pro/tienda'
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
          body: JSON.stringify(successMessage)
        });

        return await messageResponse.json();
      } catch (error) {
        console.error('Error en sendServerSelectionDM:', error);
        throw error;
      }
    };

    const dmResponse = await sendServerSelectionDM();

    return NextResponse.json({
      success: true,
      message: 'Whitelist Fast entregada exitosamente',
      botResponse,
      dmResponse,
      deliveryDetails: {
        userId,
        transactionId,
        selectedServer,
        kitName,
        items,
        deliveredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en entrega de Whitelist Fast:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

function getServerName(serverId: string): string {
  const servers = {
    'los-santos': 'Los Santos',
    'liberty-city': 'Liberty City',
    'las-venturas': 'Las Venturas'
  };
  return servers[serverId as keyof typeof servers] || 'Los Santos';
}

function getServerEmoji(serverId: string): string {
  const emojis = {
    'los-santos': 'Los Santos',
    'liberty-city': 'Liberty City',
    'las-venturas': 'Las Venturas'
  };
  return emojis[serverId as keyof typeof emojis] || 'Los Santos';
}

function getServerInvite(serverId: string): string {
  const invites = {
    'los-santos': 'https://discord.gg/WZVr3HhaCr',
    'liberty-city': 'https://discord.gg/',
    'las-venturas': 'https://discord.gg/'
  };
  return invites[serverId as keyof typeof invites] || 'https://discord.gg/WZVr3HhaCr';
}

function getServerEmbed(serverId: string): any {
  const embeds = {
    'los-santos': {
      title: 'Los Santos',
      description: 'Bienvenido a un entorno donde cada decisión importa y cada acción tiene consecuencias. En este servidor vivirás una experiencia 100% realista, ambientada en una ciudad moderna llena de oportunidades, negocios, trabajo duro y recompensas reales para quienes se esfuerzan.',
      color: 0x8b5cf6, 
      fields: [
        {
          name: 'Únete a las fuerzas del orden:',
          value: 'Los Santos Police Department (LSPD), Los Santos Sheriff Department (LSSD), Fire, Medical y Transit Department, Departamento de Justicia y USCIS, Federales: FBI, DEA, USSS, ICE',
          inline: false
        },
        {
          name: 'Forma tu organización junto a amigos:',
          value: 'Pandillas, mafias, empresas y organizaciones privadas.',
          inline: false
        },
        {
          name: 'Sistema avanzado de propiedades:',
          value: 'Apartamentos, mansiones, garajes, negocios y más.',
          inline: false
        },
        {
          name: 'Crea tu empresa:',
          value: 'Comercio, seguridad privada, transporte, logística, entretenimiento y más.',
          inline: false
        },
        {
          name: 'Trabajos disponibles:',
          value: 'Camionero, mecánico, pescador, taxi, seguridad, etc.',
          inline: false
        },
        {
          name: 'Eventos dinámicos y economía realista:',
          value: 'Persecuciones, operativos tácticos, crimen urbano y misiones especiales.',
          inline: false
        }
      ],
      thumbnail: {
        url: 'https://www.erlchub.pro/public/servidores/los-santos.png'
      }
    },
    'liberty-city': {
      title: 'Liberty City',
      description: 'Experimenta la vida en una metrópolis llena de contrastes, donde la ambición choca con la realidad en cada esquina. Liberty City ofrece un entorno urbano denso con oportunidades ilimitadas para aquellos que se atreven a soñar en grande.',
      color: 0x3b82f6,
      fields: [
        {
          name: 'Departamentos de policía:',
          value: 'LCPD, Liberty County Sheriff, Liberty Fire Department, EMS y más.',
          inline: false
        },
        {
          name: 'Organizaciones criminales:',
          value: 'Mafias italianas, rusas, irlandesas y bandas urbanas.',
          inline: false
        },
        {
          name: 'Distritos exclusivos:',
          value: 'Algonquin, Broker, Dukes, Bohan y Alderney.',
          inline: false
        },
        {
          name: 'Sistema financiero:',
          value: 'Bancos, inversiones, bolsa de valores y criptomonedas.',
          inline: false
        },
        {
          name: 'Industrias disponibles:',
          value: 'Construcción, tecnología, medios, entretenimiento y hostelería.',
          inline: false
        },
        {
          name: 'Vida nocturna y cultura:',
          value: 'Clubes exclusivos, casinos, restaurantes y eventos culturales.',
          inline: false
        }
      ],
      thumbnail: {
        url: 'https://www.erlchub.pro/public/servidores/liberty-city.png'
      }
    },
    'las-venturas': {
      title: 'Las Venturas',
      description: 'Donde los sueños se hacen realidad o se rompen en el desierto. Las Venturas es una ciudad de contrastes extremos: luces de neón, casinos de lujo, y oportunidades doradas para aquellos con audacia para arriesgarlo todo.',
      color: 0xfbbf24, 
      fields: [
        {
          name: 'Autoridad local:',
          value: 'LVPD, Las Venturas Sheriff, Casino Security y Gaming Commission.',
          inline: false
        },
        {
          name: 'Imperios del entretenimiento:',
          value: 'Casinos, hoteles de lujo, circuitos de carreras y arenas de combate.',
          inline: false
        },
        {
          name: 'Zonas turísticas:',
          value: 'The Strip, Fremont Street, Red Rock Canyon y Lake Las Vegas.',
          inline: false
        },
        {
          name: 'Empresas de juego:',
          value: 'Casinos, salones de poker, casas de apuestas y loterías.',
          inline: false
        },
        {
          name: 'Servicios turísticos:',
          value: 'Guías, hotelería, transporte y entretenimiento VIP.',
          inline: false
        },
        {
          name: 'Eventos especiales:',
          value: 'Conciertos, torneos de poker, carreras y espectáculos.',
          inline: false
        }
      ],
      thumbnail: {
        url: 'https://www.erlchub.pro/public/servidores/las-venturas.png'
      }
    }
  };

  return embeds[serverId as keyof typeof embeds] || embeds['los-santos'];
}
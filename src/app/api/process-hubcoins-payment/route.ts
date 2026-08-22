import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, items, totalHubCoins } = await request.json();

    if (!userId || !items || !totalHubCoins) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ discordId: userId });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.hubCoins < totalHubCoins) {
      return NextResponse.json({ success: false, error: 'Hub Coins insuficientes' }, { status: 400 });
    }

    const newBalance = user.hubCoins - totalHubCoins;
    await db.collection('users').updateOne(
      { discordId: userId },
      { 
        $set: { hubCoins: newBalance },
        $push: {
          transactions: {
            type: 'purchase',
            amount: -totalHubCoins,
            description: `Compra de kit: ${items.map((item: any) => item.name).join(', ')}`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        }
      }
    );

    try {
      const kitItems = items.map((item: any) => ({
        name: item.name,
        items: item.items || [] 
      }));

      for (const kit of kitItems) {
        const botResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://www.erlchub.pro'}/api/discord-bot/deliver-kit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            kitName: kit.name,
            kitItems: kit.items,
            serverId: '1432194616224120916',
            transactionId: `HC-${Date.now()}-${userId}`
          })
        });

        const botResult = await botResponse.json();
        
        if (!botResult.success) {
          console.error(`Error entregando kit ${kit.name}:`, botResult.error);
        } else {
          console.log(`Kit ${kit.name} entregado exitosamente al usuario ${userId}`);
        }
      }
    } catch (botError) {
      console.error('Error en integración con bot de Discord:', botError);
    }

    return NextResponse.json({
      success: true,
      newBalance,
      message: 'Pago procesado exitosamente. Los kits serán entregados en el servidor de Los Santos.',
      kitsDelivered: true
    });

  } catch (error) {
    console.error('Error procesando pago con Hub Coins:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
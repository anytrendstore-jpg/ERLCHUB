import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { listActiveCatalogByType } from '@/lib/shopCatalogServer';
import { grantCharacterSlots } from '@/lib/characterServer';

export async function POST(request: NextRequest) {
  try {
    const { userId, items } = await request.json();

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // El precio y el nombre reales salen siempre del catálogo del servidor por item.id — nunca
    // de lo que mande el cliente, porque esta ruta ahora también otorga cupos de personaje reales.
    const kits = await listActiveCatalogByType('kit');
    const matchedKits = items
      .map((item: any) => kits.find((k) => k.id === item?.id))
      .filter((k): k is NonNullable<typeof k> => Boolean(k));

    if (matchedKits.length !== items.length) {
      return NextResponse.json({ success: false, error: 'Uno o más items del carrito no son válidos' }, { status: 400 });
    }

    const totalHubCoins = matchedKits.reduce((sum, k) => sum + k.priceHubCoins, 0);

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
            description: `Compra de kit: ${matchedKits.map((k) => k.name).join(', ')}`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        }
      }
    );

    await db.collection('hubcoins_transactions').insertOne({
      userId,
      amount: totalHubCoins,
      type: 'purchase',
      description: `Compra de kit: ${matchedKits.map((k) => k.name).join(', ')}`,
      status: 'completed',
      metadata: {
        kitIds: matchedKits.map((k) => k.id),
        kitNames: matchedKits.map((k) => k.name),
      },
      timestamp: new Date(),
    });

    const slotsToGrant = matchedKits.reduce((sum, k) => sum + (k.characterSlotsGranted || 0), 0);
    let newCharacterSlots: number | null = null;
    if (slotsToGrant > 0) {
      newCharacterSlots = await grantCharacterSlots(userId, slotsToGrant);
    }

    try {
      for (const kit of matchedKits) {
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
      newCharacterSlots,
      message: 'Pago procesado exitosamente. Los kits serán entregados en el servidor de Los Santos.',
      kitsDelivered: true
    });

  } catch (error) {
    console.error('Error procesando pago con Hub Coins:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
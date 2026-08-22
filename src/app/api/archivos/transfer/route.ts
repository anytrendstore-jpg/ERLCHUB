import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentArchivosUser, itemTransfersCollection, type TransferableItemType } from '@/lib/archivosServer';
import { socialProfilesCollection } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';
import { playerWeaponsCollection } from '@/lib/ammoServer';
import { playerVehiclesCollection } from '@/lib/dealerServer';
import { playerPropertiesCollection } from '@/lib/propertiesServer';

export const dynamic = 'force-dynamic';

const APP_ID_BY_TYPE: Record<TransferableItemType, string> = { armas: 'ammunation', vehiculos: 'dealer', propiedades: 'properties' };
const LABEL_BY_TYPE: Record<TransferableItemType, string> = { armas: 'arma', vehiculos: 'vehículo', propiedades: 'propiedad' };

/** Transfiere un objeto que el jugador YA posee a otro jugador real (distinto de "regalar al comprar"). */
export async function POST(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { itemType, itemId, toUserId } = await request.json() as { itemType: TransferableItemType; itemId: string; toUserId: string };
    if (!itemType || !itemId || !toUserId) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    if (toUserId === me.id) return NextResponse.json({ success: false, error: 'No puedes transferirte un objeto a ti mismo' }, { status: 400 });

    const profilesCol = await socialProfilesCollection();
    const recipient = await profilesCol.findOne({ discordId: toUserId });
    if (!recipient) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });

    let col;
    if (itemType === 'armas') col = await playerWeaponsCollection();
    else if (itemType === 'vehiculos') col = await playerVehiclesCollection();
    else if (itemType === 'propiedades') col = await playerPropertiesCollection();
    else return NextResponse.json({ success: false, error: 'Tipo de objeto no válido' }, { status: 400 });

    const item = await col.findOne({ id: itemId } as any);
    if (!item) return NextResponse.json({ success: false, error: 'Objeto no encontrado' }, { status: 404 });
    if ((item as any).ownerId !== me.id) return NextResponse.json({ success: false, error: 'No eres el propietario de este objeto' }, { status: 403 });

    await col.updateOne({ id: itemId } as any, { $set: { ownerId: toUserId } } as any);

    const transfersCol = await itemTransfersCollection();
    const transfer = {
      id: crypto.randomUUID(),
      itemType,
      itemId,
      itemName: (item as any).name,
      fromId: me.id,
      fromName: me.displayName,
      toId: toUserId,
      toName: recipient.displayName || recipient.username,
      transferredAt: new Date(),
    };
    await transfersCol.insertOne(transfer);

    const appId = APP_ID_BY_TYPE[itemType];
    const label = LABEL_BY_TYPE[itemType];
    await notifyUser(me.id, {
      title: 'Objeto transferido',
      message: `Transferiste tu ${label} "${(item as any).name}" a ${recipient.displayName || recipient.username}`,
      type: 'success',
      appId,
    });
    await notifyUser(toUserId, {
      title: 'Recibiste un objeto',
      message: `${me.displayName} te transfirió ${label === 'arma' ? 'el arma' : label === 'vehículo' ? 'el vehículo' : 'la propiedad'} "${(item as any).name}"`,
      type: 'success',
      appId,
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    console.error('Error transfiriendo objeto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la transferencia' }, { status: 500 });
  }
}

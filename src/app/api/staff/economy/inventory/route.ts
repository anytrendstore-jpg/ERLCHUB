import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { notifyUser } from '@/lib/notificationsServer';
import { socialProfilesCollection } from '@/lib/socialServer';
import { marketplacePurchasesCollection } from '@/lib/marketplaceServer';
import { playerWeaponsCollection } from '@/lib/ammoServer';
import { playerVehiclesCollection } from '@/lib/dealerServer';
import { playerPropertiesCollection } from '@/lib/propertiesServer';
import { itemTransfersCollection, type TransferableItemType } from '@/lib/archivosServer';

export const dynamic = 'force-dynamic';

/** Vista de solo lectura del inventario real de un jugador, para el panel de Staff. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const discordId = request.nextUrl.searchParams.get('discordId')?.trim();
    if (!discordId) return NextResponse.json({ success: false, error: 'Falta el ID del jugador' }, { status: 400 });

    const [purchasesCol, weaponsCol, vehiclesCol, propsCol] = await Promise.all([
      marketplacePurchasesCollection(),
      playerWeaponsCollection(),
      playerVehiclesCollection(),
      playerPropertiesCollection(),
    ]);

    const [purchases, weapons, vehicles, properties] = await Promise.all([
      purchasesCol.find({ buyerId: discordId }).sort({ createdAt: -1 }).toArray(),
      weaponsCol.find({ ownerId: discordId }).sort({ purchasedAt: -1 }).toArray(),
      vehiclesCol.find({ ownerId: discordId }).sort({ purchasedAt: -1 }).toArray(),
      propsCol.find({ ownerId: discordId }).sort({ purchasedAt: -1 }).toArray(),
    ]);

    const items = [
      ...purchases.map((p) => ({ itemType: 'compras' as const, id: p.id, name: p.listingName, category: 'Producto', source: 'MercadoLibre', purchasedAt: p.createdAt })),
      ...weapons.map((w) => ({ itemType: 'armas' as const, id: w.id, name: w.name, category: w.category, source: 'Ammu-Nation', purchasedAt: w.purchasedAt })),
      ...vehicles.map((v) => ({ itemType: 'vehiculos' as const, id: v.id, name: v.name, category: v.brand, source: 'Concesionario', purchasedAt: v.purchasedAt })),
      ...properties.map((pr) => ({ itemType: 'propiedades' as const, id: pr.id, name: pr.name, category: pr.type, source: 'Propiedades', purchasedAt: pr.purchasedAt })),
    ];

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error leyendo inventario del jugador:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

const APP_ID_BY_TYPE: Record<TransferableItemType, string> = { armas: 'ammunation', vehiculos: 'dealer', propiedades: 'properties' };

/** Transferencia administrativa: Staff mueve un objeto regulado (arma/vehículo/propiedad) de un jugador a otro, con auditoría. */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { itemType, itemId, fromId, toUserId, reason } = await request.json() as {
      itemType: TransferableItemType; itemId: string; fromId: string; toUserId: string; reason?: string;
    };
    if (!itemType || !itemId || !fromId || !toUserId) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const profilesCol = await socialProfilesCollection();
    const [fromProfile, toProfile] = await Promise.all([
      profilesCol.findOne({ discordId: fromId }),
      profilesCol.findOne({ discordId: toUserId }),
    ]);
    if (!toProfile) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });

    let col;
    if (itemType === 'armas') col = await playerWeaponsCollection();
    else if (itemType === 'vehiculos') col = await playerVehiclesCollection();
    else if (itemType === 'propiedades') col = await playerPropertiesCollection();
    else return NextResponse.json({ success: false, error: 'Tipo de objeto no válido' }, { status: 400 });

    const item = await col.findOne({ id: itemId } as any);
    if (!item) return NextResponse.json({ success: false, error: 'Objeto no encontrado' }, { status: 404 });
    if ((item as any).ownerId !== fromId) return NextResponse.json({ success: false, error: 'Ese objeto ya no pertenece a ese jugador' }, { status: 409 });

    await col.updateOne({ id: itemId } as any, { $set: { ownerId: toUserId } } as any);

    const identity = staffIdentity();
    const transfersCol = await itemTransfersCollection();
    await transfersCol.insertOne({
      id: crypto.randomUUID(),
      itemType, itemId, itemName: (item as any).name,
      fromId, fromName: fromProfile?.displayName || fromProfile?.username || fromId,
      toId: toUserId, toName: toProfile.displayName || toProfile.username,
      transferredAt: new Date(),
    });

    const appId = APP_ID_BY_TYPE[itemType];
    await notifyUser(fromId, {
      title: 'Objeto reasignado por Staff',
      message: `Staff transfirió tu objeto "${(item as any).name}" a otro jugador${reason ? `: ${reason}` : ''}`,
      type: 'warning',
      appId,
    });
    await notifyUser(toUserId, {
      title: 'Recibiste un objeto de Staff',
      message: `Staff te asignó el objeto "${(item as any).name}"${reason ? `: ${reason}` : ''}`,
      type: 'info',
      appId,
    });

    await logStaffAction({
      type: 'inventory_item_transferred',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      target: (item as any).name,
      description: `${identity?.name || 'Director'} transfirió "${(item as any).name}" (${itemType}) de ${fromId} a ${toUserId}${reason ? ` — Motivo: ${reason}` : ''}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en transferencia administrativa:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la transferencia' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentAmmoUser, ammoItemsCollection, playerWeaponsCollection, playerLicensesCollection } from '@/lib/ammoServer';
import { getBalance, adjustBalance } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { socialProfilesCollection } from '@/lib/socialServer';
import { getWeaponCapacityUsage, weaponWeight } from '@/lib/inventoryCapacity';
import { economyTaxRates } from '@/lib/staffServer';
import { adjustTreasury } from '@/lib/treasuryServer';

export const dynamic = 'force-dynamic';

const LICENSE_PRICE = 5000;

export async function POST(request: NextRequest) {
  const me = await currentAmmoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { itemId, giftToId } = await request.json();
    const itemsCol = await ammoItemsCollection();
    const item = await itemsCol.findOne({ id: itemId });
    if (!item) return NextResponse.json({ success: false, error: 'Artículo no encontrado' }, { status: 404 });
    if (item.stock <= 0) return NextResponse.json({ success: false, error: 'Sin stock' }, { status: 400 });

    let giftRecipient: { discordId: string; username: string; displayName: string } | null = null;
    if (giftToId && giftToId !== me.id) {
      const profilesCol = await socialProfilesCollection();
      const p = await profilesCol.findOne({ discordId: giftToId });
      if (!p) return NextResponse.json({ success: false, error: 'No se encontró al jugador destinatario' }, { status: 404 });
      giftRecipient = { discordId: p.discordId, username: p.username, displayName: p.displayName || p.username };
    }
    const ownerId = giftRecipient?.discordId || me.id;

    if (item.requiresLicense) {
      const licensesCol = await playerLicensesCollection();
      const license = await licensesCol.findOne({ discordId: ownerId, type: 'weapons' });
      if (!license) {
        return NextResponse.json({
          success: false,
          error: giftRecipient ? `${giftRecipient.displayName} necesita la Licencia de Portación de Armas` : 'Necesitas la Licencia de Portación de Armas',
        }, { status: 403 });
      }
    }

    const capacity = await getWeaponCapacityUsage(ownerId);
    const incomingWeight = weaponWeight(item.category);
    if (capacity.used + incomingWeight > capacity.max) {
      return NextResponse.json({
        success: false,
        error: giftRecipient
          ? `El inventario de ${giftRecipient.displayName} está lleno (${capacity.used}/${capacity.max} kg)`
          : `Tu inventario de armas está lleno (${capacity.used}/${capacity.max} kg). Libera espacio en Archivos antes de comprar más.`,
      }, { status: 403 });
    }

    const taxCol = await economyTaxRates();
    const taxDoc = await taxCol.findOne({ category: 'tienda' });
    const taxRate = (taxDoc?.percentage ?? 0) / 100;
    const tax = Math.round(item.price * taxRate * 100) / 100;
    const totalCharge = item.price + tax;

    const balance = await getBalance(me.id);
    if (balance < totalCharge) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    await adjustBalance({
      discordId: me.id,
      delta: -totalCharge,
      type: 'expense',
      description: giftRecipient ? `Regalo para @${giftRecipient.username}: ${item.name}` : `Ammu-Nation: ${item.name}`,
      counterpartyId: giftRecipient?.discordId,
      metadata: tax > 0 ? { tax, basePrice: item.price } : undefined,
    });
    if (tax > 0) {
      await adjustTreasury({
        delta: tax, type: 'tax_revenue', description: `Impuesto de tienda — Ammu-Nation: ${item.name}`,
        actorId: 'system', actorName: 'Ammu-Nation automático',
      });
    }
    await itemsCol.updateOne({ id: itemId }, { $inc: { stock: -1 } });

    const weaponsCol = await playerWeaponsCollection();
    const doc = {
      id: crypto.randomUUID(), ownerId, itemId: item.id, name: item.name, category: item.category,
      giftedBy: giftRecipient ? me.id : undefined,
      purchasedAt: new Date(),
    };
    await weaponsCol.insertOne(doc);

    if (giftRecipient) {
      await notifyUser(me.id, { title: 'Regalo enviado', message: `Le regalaste ${item.name} a ${giftRecipient.displayName}`, type: 'success', appId: 'ammunation' });
      await notifyUser(giftRecipient.discordId, { title: '🎁 Recibiste un regalo', message: `${me.displayName} te regaló ${item.name} en Ammu-Nation`, type: 'success', appId: 'ammunation' });
    } else {
      await notifyUser(me.id, { title: 'Compra realizada', message: `Compraste ${item.name} por $${totalCharge.toLocaleString('es-CO')}${tax > 0 ? ` (incluye $${tax.toLocaleString('es-CO')} de impuesto)` : ''}`, type: 'success', appId: 'ammunation' });
    }

    return NextResponse.json({ success: true, item: doc });
  } catch (error) {
    console.error('Error comprando en Ammu-Nation:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}

export async function PATCH() {
  // Comprar la licencia de portación de armas.
  const me = await currentAmmoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const licensesCol = await playerLicensesCollection();
    const existing = await licensesCol.findOne({ discordId: me.id, type: 'weapons' });
    if (existing) return NextResponse.json({ success: false, error: 'Ya tienes la licencia' }, { status: 400 });

    const balance = await getBalance(me.id);
    if (balance < LICENSE_PRICE) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

    await adjustBalance({ discordId: me.id, delta: -LICENSE_PRICE, type: 'expense', description: 'Licencia de Portación de Armas' });
    await licensesCol.insertOne({ discordId: me.id, type: 'weapons', purchasedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error comprando licencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}

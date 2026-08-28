import { connectToDatabase } from '@/lib/mongodb';
import { shopOrdersCollection } from '@/lib/shopOrdersServer';

/**
 * Descuento de bienvenida (15% en la primera compra real de cada jugador). Vive como un cupón
 * normal en `discount_codes` (mismo sistema que usa el panel de staff) marcado con
 * `firstPurchaseOnly: true`, para que /api/discounts/validate y /api/shop/checkout/prepare lo
 * traten igual que cualquier otro cupón salvo por una verificación extra: nunca se confía en que
 * el cliente diga "sí soy elegible" — siempre se revisa `shop_orders` server-side antes de
 * aplicarlo, tanto al validar el código como (de nuevo, por las dudas) al cobrar de verdad.
 */
export const FIRST_PURCHASE_CODE = 'BIENVENIDA15';
export const FIRST_PURCHASE_PERCENTAGE = 15;

export async function hasCompletedPurchase(discordId: string): Promise<boolean> {
  const col = await shopOrdersCollection();
  const existing = await col.findOne({ discordId, status: 'completed' });
  return existing !== null;
}

export async function ensureFirstPurchaseDiscountCode(): Promise<void> {
  const db = await connectToDatabase();
  const col = db.collection('discount_codes');
  const existing = await col.findOne({ code: FIRST_PURCHASE_CODE });
  if (existing) return;

  const now = new Date();
  await col.insertOne({
    code: FIRST_PURCHASE_CODE,
    discountPercentage: FIRST_PURCHASE_PERCENTAGE,
    description: '15% de descuento en tu primera compra',
    createdAt: now,
    expiresAt: new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()),
    isActive: true,
    usageCount: 0,
    firstPurchaseOnly: true,
  });
}

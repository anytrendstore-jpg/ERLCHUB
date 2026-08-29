import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import type { ShopCatalogType } from '@/lib/shopCatalogServer';

/**
 * Orden creada server-side ANTES de mandar al comprador a pagar — el precio se fija acá
 * (nunca confiando en lo que mande el navegador) y el `reference` que ya usa Wompi queda
 * registrado con esta orden como clave, para que el webhook (wompi/events) sepa exactamente
 * qué entregar cuando el pago se aprueba. Antes de esto, el checkout no dejaba ningún rastro
 * de qué se estaba comprando — ver Fase C del plan.
 */
export interface ShopOrderItem {
  catalogId: string;
  type: ShopCatalogType;
  name: string;
  quantity: number;
  unitPriceUSD: number;
  paymentType?: 'monthly' | 'permanent';
}

export interface ShopOrder {
  id: string;
  reference: string;
  discordId: string;
  items: ShopOrderItem[];
  amountUSD: number;
  amountInCents: number;
  currency: 'COP';
  status: 'pending' | 'delivering' | 'completed' | 'failed';
  failReason?: string;
  /** Cupón aplicado a esta orden (si hubo uno) y el monto original antes de descontarlo, para trazabilidad. */
  discountCode?: string;
  discountPercentage?: number;
  originalAmountUSD?: number;
  /** Payment Source de Wompi usado para este cobro (compra inicial con auto-renovación, o una renovación automática) — ausente en pagos únicos por widget. */
  paymentSourceId?: number;
  /** true si esta orden es una renovación automática disparada por el cron, no una compra iniciada por el usuario. */
  isRenewal?: boolean;
  /** Id de sesión anónima del funnel de la tienda (ver storeEventsServer.ts) — permite medir la
   * conversión real del funnel contra órdenes de verdad, sin un evento de "compra" separado. */
  trackingSessionId?: string;
  /** `payment_method.type` que devuelve Wompi en el webhook (CARD, NEQUI, PSE, BANCOLOMBIA_TRANSFER,
   * etc.) — se completa recién en la entrega, nunca se conoce al crear la orden. */
  paymentMethodType?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export async function shopOrdersCollection(): Promise<Collection<ShopOrder>> {
  const db = await connectToDatabase();
  const col = db.collection<ShopOrder>('shop_orders');
  await col.createIndex({ reference: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ discordId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function createOrder(input: {
  reference: string;
  discordId: string;
  items: ShopOrderItem[];
  amountUSD: number;
  amountInCents: number;
  paymentSourceId?: number;
  isRenewal?: boolean;
  discountCode?: string;
  discountPercentage?: number;
  originalAmountUSD?: number;
  trackingSessionId?: string;
}): Promise<ShopOrder> {
  const col = await shopOrdersCollection();
  const now = new Date();
  const order: ShopOrder = {
    id: crypto.randomUUID(),
    reference: input.reference,
    discordId: input.discordId,
    items: input.items,
    amountUSD: input.amountUSD,
    amountInCents: input.amountInCents,
    currency: 'COP',
    status: 'pending',
    paymentSourceId: input.paymentSourceId,
    isRenewal: input.isRenewal,
    discountCode: input.discountCode,
    discountPercentage: input.discountPercentage,
    originalAmountUSD: input.originalAmountUSD,
    trackingSessionId: input.trackingSessionId,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(order);
  return order;
}

export async function getOrderByReference(reference: string): Promise<ShopOrder | null> {
  const col = await shopOrdersCollection();
  return col.findOne({ reference });
}

/** Guardia atómica de entrada al webhook: solo una llamada puede pasar de 'pending' a 'delivering' — cubre reintentos de Wompi sin entregar dos veces. */
export async function claimOrderForDelivery(reference: string): Promise<ShopOrder | null> {
  const col = await shopOrdersCollection();
  const result = await col.findOneAndUpdate(
    { reference, status: 'pending' },
    { $set: { status: 'delivering', updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return result;
}

export async function markOrderCompleted(reference: string, paymentMethodType?: string): Promise<void> {
  const col = await shopOrdersCollection();
  const now = new Date();
  await col.updateOne(
    { reference },
    { $set: { status: 'completed', updatedAt: now, completedAt: now, ...(paymentMethodType ? { paymentMethodType } : {}) } }
  );
}

export async function markOrderFailed(reference: string, reason: string): Promise<void> {
  const col = await shopOrdersCollection();
  await col.updateOne({ reference }, { $set: { status: 'failed', failReason: reason, updatedAt: new Date() } });
}

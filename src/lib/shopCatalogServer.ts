import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Catálogo real de la tienda OCC (dinero fuera de personaje: membresías, kits, Hub Coins,
 * artículos, whitelist fast). Reemplaza `economy_items` para este dominio — a diferencia de
 * esa colección genérica (`fields: Record<string, string|number|boolean>`, sin arrays), acá
 * cada tipo tiene su forma real (benefits/items como arrays), la misma que ya usan las páginas
 * públicas vía `src/lib/types.ts`. Es la única fuente de verdad: tanto el panel admin como
 * `/tienda` y el checkout leen de acá, nunca del array estático `shopData.ts` (que solo sirve
 * como semilla inicial y sigue vivo para `casinoGames`/`currencies`, fuera de este catálogo).
 */

interface CatalogBase {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface CatalogMembership extends CatalogBase {
  type: 'membership';
  sortOrder: number;
  name: string;
  description: string;
  image: string;
  benefits: string[];
  priceMonthly: number;
  pricePermanent: number;
  color: string;
}

export interface CatalogKit extends CatalogBase {
  type: 'kit';
  sortOrder: number;
  name: string;
  description: string;
  image: string;
  items: string[];
  priceHubCoins: number;
  category: string;
  color: string;
  characterSlotsGranted?: number;
}

export interface CatalogHubCoinsPackage extends CatalogBase {
  type: 'hub-coins-package';
  sortOrder: number;
  coins: number;
  bonus: number;
  priceUSD: number;
  popular?: boolean;
}

export interface CatalogItem extends CatalogBase {
  type: 'item';
  sortOrder: number;
  name: string;
  description: string;
  image: string;
  priceHubCoins: number;
  category: string;
  itemType: 'vehicle' | 'weapon' | 'clothing' | 'accessory' | 'other';
}

export interface CatalogWhitelistFast extends CatalogBase {
  type: 'whitelist-fast';
  name: string;
  description: string;
  image: string;
  items: string[];
  priceDollars: number;
  category: string;
  color: string;
}

export type ShopCatalogDoc = CatalogMembership | CatalogKit | CatalogHubCoinsPackage | CatalogItem | CatalogWhitelistFast;
export type ShopCatalogType = ShopCatalogDoc['type'];

export async function shopCatalogCollection(): Promise<Collection<ShopCatalogDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<ShopCatalogDoc>('shop_catalog');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ type: 1 }).catch(() => {});
  return col;
}

export async function getCatalogItem(id: string): Promise<ShopCatalogDoc | null> {
  const col = await shopCatalogCollection();
  return col.findOne({ id });
}

export async function listCatalogByType<T extends ShopCatalogType>(type: T): Promise<Extract<ShopCatalogDoc, { type: T }>[]> {
  const col = await shopCatalogCollection();
  const docs = await col.find({ type }).sort({ sortOrder: 1 }).toArray();
  return docs as unknown as Extract<ShopCatalogDoc, { type: T }>[];
}

export async function listActiveCatalogByType<T extends ShopCatalogType>(type: T): Promise<Extract<ShopCatalogDoc, { type: T }>[]> {
  const col = await shopCatalogCollection();
  const docs = await col.find({ type, active: true }).sort({ sortOrder: 1 }).toArray();
  return docs as unknown as Extract<ShopCatalogDoc, { type: T }>[];
}

export async function listActiveCatalog(): Promise<ShopCatalogDoc[]> {
  const col = await shopCatalogCollection();
  return col.find({ active: true }).sort({ type: 1, sortOrder: 1 }).toArray();
}

export async function upsertCatalogItem(doc: Omit<ShopCatalogDoc, 'createdAt' | 'updatedAt'>, updatedBy: string): Promise<ShopCatalogDoc> {
  const col = await shopCatalogCollection();
  const now = new Date();
  const existing = await col.findOne({ id: doc.id });
  const full = { ...doc, updatedBy, updatedAt: now, createdAt: existing?.createdAt || now } as ShopCatalogDoc;
  await col.updateOne({ id: doc.id }, { $set: full }, { upsert: true });
  return full;
}

export async function deactivateCatalogItem(id: string, updatedBy: string): Promise<void> {
  const col = await shopCatalogCollection();
  await col.updateOne({ id }, { $set: { active: false, updatedBy, updatedAt: new Date() } });
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const col = await shopCatalogCollection();
  await col.deleteOne({ id });
}

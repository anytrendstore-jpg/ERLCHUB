import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

export interface AmmoItem {
  id: string;
  name: string;
  category: 'Pistola' | 'Rifle' | 'Escopeta' | 'Munición' | 'Accesorio' | 'Chaleco';
  price: number;
  damage?: number;
  fireRate?: number;
  requiresLicense: boolean;
  legal: boolean;
  stock: number;
  createdAt: Date;
}

export interface PlayerWeapon {
  id: string;
  ownerId: string;
  itemId: string;
  name: string;
  category: string;
  giftedBy?: string;
  purchasedAt: Date;
}

export interface PlayerLicense {
  discordId: string;
  type: 'weapons';
  purchasedAt: Date;
}

export async function currentAmmoUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function ammoItemsCollection(): Promise<Collection<AmmoItem>> {
  const db = await connectToDatabase();
  const col = db.collection<AmmoItem>('ammunation_items');
  await col.createIndex({ category: 1 }).catch(() => {});
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function playerWeaponsCollection(): Promise<Collection<PlayerWeapon>> {
  const db = await connectToDatabase();
  const col = db.collection<PlayerWeapon>('player_weapons');
  await col.createIndex({ ownerId: 1 }).catch(() => {});
  return col;
}

export async function playerLicensesCollection(): Promise<Collection<PlayerLicense>> {
  const db = await connectToDatabase();
  const col = db.collection<PlayerLicense>('player_licenses');
  await col.createIndex({ discordId: 1, type: 1 }, { unique: true }).catch(() => {});
  return col;
}

const SEED: Array<Omit<AmmoItem, 'id' | 'createdAt'>> = [
  { name: 'Pistola 9mm', category: 'Pistola', price: 3500, damage: 25, fireRate: 3, requiresLicense: true, legal: true, stock: 40 },
  { name: 'Revólver .357', category: 'Pistola', price: 4200, damage: 35, fireRate: 1, requiresLicense: true, legal: true, stock: 25 },
  { name: 'Rifle de Asalto', category: 'Rifle', price: 12000, damage: 45, fireRate: 8, requiresLicense: true, legal: true, stock: 15 },
  { name: 'Rifle de Francotirador', category: 'Rifle', price: 18000, damage: 90, fireRate: 1, requiresLicense: true, legal: true, stock: 8 },
  { name: 'Escopeta Táctica', category: 'Escopeta', price: 8500, damage: 60, fireRate: 1, requiresLicense: true, legal: true, stock: 20 },
  { name: 'Caja de Munición 9mm', category: 'Munición', price: 500, requiresLicense: false, legal: true, stock: 200 },
  { name: 'Caja de Munición Rifle', category: 'Munición', price: 800, requiresLicense: false, legal: true, stock: 150 },
  { name: 'Mira Táctica', category: 'Accesorio', price: 1500, requiresLicense: false, legal: true, stock: 60 },
  { name: 'Silenciador', category: 'Accesorio', price: 2200, requiresLicense: false, legal: true, stock: 30 },
  { name: 'Chaleco Nivel II', category: 'Chaleco', price: 2800, requiresLicense: false, legal: true, stock: 50 },
  { name: 'Chaleco Nivel IV', category: 'Chaleco', price: 6500, requiresLicense: false, legal: true, stock: 20 },
];

export async function ensureAmmoSeeded(): Promise<Collection<AmmoItem>> {
  const col = await ammoItemsCollection();
  const count = await col.countDocuments();
  if (count > 0) return col;
  const now = new Date();
  // Upsert por name (índice único): dos requests concurrentes viendo count===0 a la vez no deben
  // poder duplicar el catálogo semilla.
  await Promise.all(SEED.map((i) => col.updateOne(
    { name: i.name },
    { $setOnInsert: { ...i, id: crypto.randomUUID(), createdAt: now } },
    { upsert: true }
  )));
  return col;
}

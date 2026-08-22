import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

export interface PropertyListing {
  id: string;
  name: string;
  type: 'Casa' | 'Apartamento' | 'Oficina' | 'Negocio' | 'Garaje';
  address: string;
  price: number;
  size: number;
  stock: number;
  createdAt: Date;
}

export interface PlayerProperty {
  id: string;
  ownerId: string;
  listingId: string;
  name: string;
  type: string;
  address: string;
  giftedBy?: string;
  purchasedAt: Date;
}

export async function currentPropertiesUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function propertyListingsCollection(): Promise<Collection<PropertyListing>> {
  const db = await connectToDatabase();
  const col = db.collection<PropertyListing>('property_listings');
  await col.createIndex({ type: 1 }).catch(() => {});
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function playerPropertiesCollection(): Promise<Collection<PlayerProperty>> {
  const db = await connectToDatabase();
  const col = db.collection<PlayerProperty>('player_properties');
  await col.createIndex({ ownerId: 1 }).catch(() => {});
  return col;
}

const SEED: Array<Omit<PropertyListing, 'id' | 'createdAt'>> = [
  { name: 'Casa Suburbana', type: 'Casa', address: 'Calle Roble 142', price: 180000, size: 220, stock: 6 },
  { name: 'Casa de Lujo', type: 'Casa', address: 'Av. Costera 88', price: 650000, size: 480, stock: 2 },
  { name: 'Apartamento Centro', type: 'Apartamento', address: 'Torre Vista 12B', price: 95000, size: 90, stock: 10 },
  { name: 'Loft Moderno', type: 'Apartamento', address: 'Distrito Este 4', price: 140000, size: 120, stock: 5 },
  { name: 'Oficina Ejecutiva', type: 'Oficina', address: 'Edificio Central 5', price: 220000, size: 150, stock: 4 },
  { name: 'Local Comercial', type: 'Negocio', address: 'Plaza Mayor 22', price: 300000, size: 200, stock: 3 },
  { name: 'Garaje Privado', type: 'Garaje', address: 'Sector Industrial 9', price: 35000, size: 40, stock: 12 },
];

export async function ensurePropertiesSeeded(): Promise<Collection<PropertyListing>> {
  const col = await propertyListingsCollection();
  const count = await col.countDocuments();
  if (count > 0) return col;
  const now = new Date();
  // Upsert por name (índice único): dos requests concurrentes viendo count===0 a la vez no deben
  // poder duplicar el catálogo semilla.
  await Promise.all(SEED.map((p) => col.updateOne(
    { name: p.name },
    { $setOnInsert: { ...p, id: crypto.randomUUID(), createdAt: now } },
    { upsert: true }
  )));
  return col;
}

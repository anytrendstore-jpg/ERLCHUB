import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

export interface DealerVehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  iconId: string;
  imageUrl: string;
  featured?: boolean;
  topSpeed: number;
  acceleration: number;
  stock: number;
  createdAt: Date;
}

export interface PlayerVehicle {
  id: string;
  ownerId: string;
  vehicleId: string;
  name: string;
  brand: string;
  iconId: string;
  imageUrl?: string;
  plate: string;
  color: string;
  financed: boolean;
  loanRemaining?: number;
  giftedBy?: string;
  purchasedAt: Date;
}

export async function currentDealerUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function dealerVehiclesCollection(): Promise<Collection<DealerVehicle>> {
  const db = await connectToDatabase();
  const col = db.collection<DealerVehicle>('dealer_vehicles');
  await col.createIndex({ category: 1 }).catch(() => {});
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function playerVehiclesCollection(): Promise<Collection<PlayerVehicle>> {
  const db = await connectToDatabase();
  const col = db.collection<PlayerVehicle>('player_vehicles');
  await col.createIndex({ ownerId: 1 }).catch(() => {});
  return col;
}

/** Foto de referencia por categoría (Unsplash), usada como respaldo cuando el vehículo no trae imageUrl propia. */
export const CATEGORY_IMAGE: Record<string, string> = {
  'Deportivo': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=700&q=80&auto=format&fit=crop',
  'Camioneta': 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=700&q=80&auto=format&fit=crop',
  'Sedán': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=700&q=80&auto=format&fit=crop',
  'Policial': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=700&q=80&auto=format&fit=crop',
  'Económico': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=700&q=80&auto=format&fit=crop',
  'Lujo': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=700&q=80&auto=format&fit=crop',
  'SUV': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=700&q=80&auto=format&fit=crop',
};
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=700&q=80&auto=format&fit=crop';

const SEED: Array<Omit<DealerVehicle, 'id' | 'createdAt' | 'imageUrl'>> = [
  { name: 'Falcon GT', brand: 'Vulcar', category: 'Deportivo', price: 85000, iconId: 'sport', featured: true, topSpeed: 280, acceleration: 3.2, stock: 5 },
  { name: 'Ranger 4x4', brand: 'Bravado', category: 'Camioneta', price: 62000, iconId: 'truck', featured: true, topSpeed: 190, acceleration: 6.1, stock: 8 },
  { name: 'Sedan Classic', brand: 'Declasse', category: 'Sedán', price: 28000, iconId: 'sedan', topSpeed: 210, acceleration: 5.4, stock: 15 },
  { name: 'Cruiser Interceptor', brand: 'Vapid', category: 'Policial', price: 48000, iconId: 'suv', topSpeed: 230, acceleration: 4.5, stock: 6 },
  { name: 'City Compact', brand: 'Karin', category: 'Económico', price: 15000, iconId: 'sedan', topSpeed: 170, acceleration: 8.0, stock: 25 },
  { name: 'Luxury Sedan S', brand: 'Ubermacht', category: 'Lujo', price: 120000, iconId: 'sedan', featured: true, topSpeed: 260, acceleration: 3.8, stock: 3 },
  { name: 'Grand Voyager SUV', brand: 'Gallivanter', category: 'SUV', price: 72000, iconId: 'suv', featured: true, topSpeed: 210, acceleration: 5.6, stock: 7 },
];

export async function ensureDealerSeeded(): Promise<Collection<DealerVehicle>> {
  const col = await dealerVehiclesCollection();

  // Rellena imageUrl para vehículos ya existentes de antes de que este campo existiera.
  const missingImage = await col.find({ imageUrl: { $exists: false } }).toArray();
  for (const v of missingImage) {
    await col.updateOne({ id: v.id }, { $set: { imageUrl: CATEGORY_IMAGE[v.category] || FALLBACK_IMAGE } });
  }

  const count = await col.countDocuments();
  if (count > 0) return col;
  const now = new Date();
  // Upsert por name (índice único): dos requests concurrentes viendo count===0 a la vez no deben
  // poder duplicar el catálogo semilla.
  await Promise.all(SEED.map((v) => col.updateOne(
    { name: v.name },
    { $setOnInsert: { ...v, id: crypto.randomUUID(), imageUrl: CATEGORY_IMAGE[v.category] || FALLBACK_IMAGE, createdAt: now } },
    { upsert: true }
  )));
  return col;
}

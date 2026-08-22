import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import type { MarketplaceListing, MarketplaceFavorite, MarketplacePurchase, MarketplaceReview, MarketplaceQuestion } from '@/lib/marketplaceTypes';

export async function currentMarketUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function marketplaceListingsCollection(): Promise<Collection<MarketplaceListing>> {
  const db = await connectToDatabase();
  const col = db.collection<MarketplaceListing>('marketplace_listings');
  await col.createIndex({ status: 1, createdAt: -1 }).catch(() => {});
  await col.createIndex({ sellerId: 1 }).catch(() => {});
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function marketplaceFavoritesCollection(): Promise<Collection<MarketplaceFavorite>> {
  const db = await connectToDatabase();
  const col = db.collection<MarketplaceFavorite>('marketplace_favorites');
  await col.createIndex({ discordId: 1, listingId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function marketplacePurchasesCollection(): Promise<Collection<MarketplacePurchase>> {
  const db = await connectToDatabase();
  const col = db.collection<MarketplacePurchase>('marketplace_purchases');
  await col.createIndex({ buyerId: 1, createdAt: -1 }).catch(() => {});
  await col.createIndex({ sellerId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function marketplaceReviewsCollection(): Promise<Collection<MarketplaceReview>> {
  const db = await connectToDatabase();
  const col = db.collection<MarketplaceReview>('marketplace_reviews');
  await col.createIndex({ listingId: 1, createdAt: -1 }).catch(() => {});
  await col.createIndex({ listingId: 1, buyerId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function marketplaceQuestionsCollection(): Promise<Collection<MarketplaceQuestion>> {
  const db = await connectToDatabase();
  const col = db.collection<MarketplaceQuestion>('marketplace_questions');
  await col.createIndex({ listingId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

const OFFICIAL_SEED: Array<Omit<MarketplaceListing, 'id' | 'createdAt' | 'updatedAt' | 'status'>> = [
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Radio Policial Motorola', description: 'Radio de comunicación profesional para fuerzas de seguridad. Alcance de 10km.', price: 15000, originalPrice: 18000, iconId: 'radio', category: 'Equipamiento', stock: 50, rating: 4.8, reviews: 124 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Kit Médico Avanzado', description: 'Kit completo para paramédicos. Incluye desfibrilador, vendajes y medicamentos.', price: 25000, iconId: 'medical', category: 'Salud', stock: 30, rating: 4.9, reviews: 89 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Chaleco Antibalas Nivel IV', description: 'Protección balística de alto nivel. Certificado para uso profesional.', price: 45000, originalPrice: 52000, iconId: 'vest', category: 'Protección', stock: 15, rating: 4.7, reviews: 256 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Laptop Táctica', description: 'Computadora portátil resistente para operaciones en campo.', price: 35000, iconId: 'laptop', category: 'Tecnología', stock: 20, rating: 4.6, reviews: 67 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Kit de Herramientas Mecánico', description: 'Set completo de herramientas para reparación de vehículos.', price: 12000, iconId: 'tools', category: 'Herramientas', stock: 100, rating: 4.5, reviews: 198 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Cámara de Vigilancia 4K', description: 'Sistema de cámara de seguridad con visión nocturna y grabación.', price: 28000, iconId: 'camera', category: 'Seguridad', stock: 40, rating: 4.8, reviews: 145 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'Uniforme Táctico Completo', description: 'Conjunto de uniforme militar/policial con múltiples bolsillos.', price: 8500, iconId: 'uniform', category: 'Ropa', stock: 200, rating: 4.4, reviews: 312 },
  { sellerId: 'official', sellerUsername: 'ERLC Official Store', official: true, name: 'GPS Tracker Profesional', description: 'Rastreador GPS de alta precisión para vehículos y personas.', price: 18000, originalPrice: 22000, iconId: 'gps', category: 'Tecnología', stock: 25, rating: 4.7, reviews: 78 },
];

/** Siembra el catálogo oficial una sola vez si la colección está vacía (no toca publicaciones de jugadores). */
export async function ensureMarketplaceSeeded(): Promise<Collection<MarketplaceListing>> {
  const col = await marketplaceListingsCollection();
  const count = await col.countDocuments({ official: true });
  if (count > 0) return col;

  const now = new Date();
  // Upsert por id (índice único): dos requests concurrentes viendo count===0 a la vez no deben
  // poder duplicar el catálogo oficial.
  await Promise.all(OFFICIAL_SEED.map((item, i) => {
    const id = `official_${i + 1}`;
    return col.updateOne(
      { id },
      { $setOnInsert: { ...item, id, status: 'active' as const, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
  }));
  return col;
}

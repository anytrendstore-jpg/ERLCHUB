import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser } from '@/lib/whitelistServer';

export interface CharacterDoc {
  id: string;
  discordId: string;
  name: string;
  avatar?: string;
  city?: string;
  job?: string;
  department?: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastSessionAt: Date;
}

export interface AccountMetaDoc {
  discordId: string;
  /**
   * Slots de personaje disponibles. Arranca en 1 para todos. El KIT PERSONAJES de la tienda
   * (2000 HubCoins, acumulable) debería sumar +1 por compra, pero hoy esa entrega pasa por un
   * webhook a un bot de Discord que no escribe nada de vuelta a esta base de datos — así que,
   * por ahora, este número lo ajusta un Director manualmente desde el Staff Panel al confirmar
   * una compra, en vez de inferirlo de un historial de transacciones inconsistente.
   */
  characterSlots: number;
  updatedAt: Date;
}

const ACTIVE_CHARACTER_COOKIE = 'active_character_id';

export async function charactersCollection(): Promise<Collection<CharacterDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<CharacterDoc>('characters');
  await col.createIndex({ discordId: 1 }).catch(() => {});
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function accountMetaCollection(): Promise<Collection<AccountMetaDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<AccountMetaDoc>('account_meta');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function getCharacterSlots(discordId: string): Promise<number> {
  const col = await accountMetaCollection();
  const doc = await col.findOne({ discordId });
  return doc?.characterSlots ?? 1;
}

/**
 * Crea el personaje principal (id === discordId a propósito: así los documentos de
 * preferencias/tema del OS, que hoy están indexados únicamente por discordId, siguen
 * funcionando sin ninguna migración para cualquier cuenta que nunca cree un segundo personaje.
 */
export async function ensurePrimaryCharacter(discordId: string, name: string, avatar?: string): Promise<CharacterDoc> {
  const col = await charactersCollection();
  const existing = await col.findOne({ id: discordId });
  if (existing) return existing;

  const now = new Date();
  const doc: CharacterDoc = {
    id: discordId,
    discordId,
    name,
    avatar,
    isPrimary: true,
    status: 'active',
    createdAt: now,
    lastSessionAt: now,
  };
  await col.insertOne(doc);
  return doc;
}

export async function listCharacters(discordId: string): Promise<CharacterDoc[]> {
  const col = await charactersCollection();
  return col.find({ discordId }).sort({ isPrimary: -1, createdAt: 1 }).toArray();
}

/** Devuelve el id del personaje activo (cookie validada contra el dueño) o el del principal si no hay ninguno elegido. */
export async function currentActiveCharacterId(): Promise<string | null> {
  const user = currentDiscordUser();
  if (!user) return null;

  const cookieId = cookies().get(ACTIVE_CHARACTER_COOKIE)?.value;
  if (cookieId) {
    const col = await charactersCollection();
    const owned = await col.findOne({ id: cookieId, discordId: user.id });
    if (owned) return owned.id;
  }
  return user.id;
}

export function setActiveCharacterCookie(characterId: string): void {
  cookies().set(ACTIVE_CHARACTER_COOKIE, characterId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

function randomAvatarSeed(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

export async function createCharacter(discordId: string, name: string, opts: { avatar?: string; city?: string }): Promise<{ character?: CharacterDoc; error?: string }> {
  const col = await charactersCollection();
  const [existingCount, slots] = await Promise.all([
    col.countDocuments({ discordId }),
    getCharacterSlots(discordId),
  ]);
  if (existingCount >= slots) return { error: 'No tenés slots de personaje disponibles' };
  if (!name.trim()) return { error: 'El nombre es obligatorio' };

  const now = new Date();
  const doc: CharacterDoc = {
    id: crypto.randomUUID(),
    discordId,
    name: name.trim(),
    avatar: opts.avatar || randomAvatarSeed(name.trim()),
    city: opts.city,
    isPrimary: false,
    status: 'active',
    createdAt: now,
    lastSessionAt: now,
  };
  await col.insertOne(doc);
  return { character: doc };
}

export async function touchCharacterSession(characterId: string): Promise<void> {
  const col = await charactersCollection();
  await col.updateOne({ id: characterId }, { $set: { lastSessionAt: new Date() } });
}

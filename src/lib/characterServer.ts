import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { connectToDatabase, getMongoClient, supportsTransactions } from '@/lib/mongodb';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { getEconomyConfig } from '@/lib/economyConfigServer';
import { adjustCash } from '@/lib/cashServer';
import { adjustBalance } from '@/lib/hubPayServer';

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
   * Slots de personaje disponibles. Arranca en 1 para todos. Dos fuentes lo suben:
   * KIT PERSONAJES/KIT FULL (comprado con Hub Coins vía process-hubcoins-payment) suma
   * +1 por compra, acumulable — ver grantCharacterSlots(). Una membresía activa (VIP/Elite/
   * Leyenda) asegura un piso de 2/3/4 en cada pago (incluida cada renovación mensual) sin
   * acumular — ver grantMembershipCharacterSlots().
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
 * Suma cupos de personaje a una cuenta (compra de kit confirmada, nunca un valor absoluto).
 * Si la cuenta todavía no tiene documento en `account_meta`, siembra el default real (1) antes
 * de sumar — si no, un `$inc` sobre un doc inexistente arrancaría desde 0 en vez de desde 1.
 */
export async function grantCharacterSlots(discordId: string, amount: number): Promise<number> {
  if (amount <= 0) return getCharacterSlots(discordId);
  const col = await accountMetaCollection();
  const existing = await col.findOne({ discordId });
  const now = new Date();
  if (!existing) {
    await col.insertOne({ discordId, characterSlots: 1 + amount, updatedAt: now });
    return 1 + amount;
  }
  const result = await col.findOneAndUpdate(
    { discordId },
    { $inc: { characterSlots: amount }, $set: { updatedAt: now } },
    { returnDocument: 'after' }
  );
  return result?.characterSlots ?? existing.characterSlots + amount;
}

/**
 * Asegura el piso de cupos que promete el rango de la membresía activa (VIP=2, Elite=3,
 * Leyenda=4). A diferencia de `grantCharacterSlots`, esto NO suma — usa `$max`, así que
 * es seguro llamarlo en cada pago (incluida cada renovación mensual) sin ir acumulando
 * cupos de más. Si el jugador ya tenía más cupos (por kits, o por un rango superior antes),
 * nunca se los baja.
 */
export async function grantMembershipCharacterSlots(discordId: string, tierSlots: number): Promise<number> {
  const col = await accountMetaCollection();
  const existing = await col.findOne({ discordId });
  const now = new Date();
  if (!existing) {
    await col.insertOne({ discordId, characterSlots: tierSlots, updatedAt: now });
    return tierSlots;
  }
  const result = await col.findOneAndUpdate(
    { discordId },
    { $max: { characterSlots: tierSlots }, $set: { updatedAt: now } },
    { returnDocument: 'after' }
  );
  return result?.characterSlots ?? Math.max(existing.characterSlots, tierSlots);
}

/**
 * Crea el personaje principal (id === discordId a propósito: así los documentos de
 * preferencias/tema del OS, que hoy están indexados únicamente por discordId, siguen
 * funcionando sin ninguna migración para cualquier cuenta que nunca cree un segundo personaje.
 */
/**
 * Otorga el saldo inicial (efectivo + banco) UNA sola vez, en el primer alta real de la cuenta.
 * El saldo es por cuenta de Discord (hubPayBalance/cashBalance no son por personaje — ver
 * createCharacter, que a propósito NO otorga nada), así que esto solo puede pasar acá, nunca
 * en un personaje secundario comprado con slots (si no, comprar slots sería una forma de
 * farmear plata gratis).
 */
async function grantStartingBalance(discordId: string): Promise<void> {
  const cfg = await getEconomyConfig();
  if (await supportsTransactions()) {
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await adjustCash({ discordId, delta: cfg.startingCash, type: 'starting_grant', description: 'Saldo inicial de personaje' }, session);
        await adjustBalance({ discordId, delta: cfg.startingBank, type: 'starting_grant', description: 'Saldo bancario inicial' }, session);
      });
    } finally {
      await session.endSession();
    }
    return;
  }
  await adjustCash({ discordId, delta: cfg.startingCash, type: 'starting_grant', description: 'Saldo inicial de personaje' });
  await adjustBalance({ discordId, delta: cfg.startingBank, type: 'starting_grant', description: 'Saldo bancario inicial' });
}

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
  await grantStartingBalance(discordId).catch((error) => {
    console.error('No se pudo otorgar el saldo inicial de personaje:', error);
  });
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

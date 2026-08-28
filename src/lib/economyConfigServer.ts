import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/** Saldo inicial de un personaje nuevo — nunca hardcodeado en el código de creación, se lee acá. */
export interface EconomyConfigDoc {
  id: 'singleton';
  startingCash: number;
  startingBank: number;
  updatedAt: Date;
  updatedBy: string;
}

const DEFAULTS = { startingCash: 250, startingBank: 2500 };

export async function economyConfigCollection(): Promise<Collection<EconomyConfigDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<EconomyConfigDoc>('economy_config');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

/** Si no hay config guardada todavía, devuelve el default real — nunca deja pasar $0 por un doc faltante. */
export async function getEconomyConfig(): Promise<{ startingCash: number; startingBank: number }> {
  const col = await economyConfigCollection();
  const doc = await col.findOne({ id: 'singleton' });
  if (!doc) return DEFAULTS;
  return { startingCash: doc.startingCash, startingBank: doc.startingBank };
}

export async function updateEconomyConfig(input: { startingCash: number; startingBank: number; updatedBy: string }): Promise<EconomyConfigDoc> {
  const col = await economyConfigCollection();
  const doc: EconomyConfigDoc = {
    id: 'singleton',
    startingCash: Math.max(0, Math.round(input.startingCash)),
    startingBank: Math.max(0, Math.round(input.startingBank)),
    updatedAt: new Date(),
    updatedBy: input.updatedBy,
  };
  await col.updateOne({ id: 'singleton' }, { $set: doc }, { upsert: true });
  return doc;
}

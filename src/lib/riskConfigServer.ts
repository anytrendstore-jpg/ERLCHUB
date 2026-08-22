import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Configuración editable por Staff de todas las "perillas" de riesgo del ecosistema
 * VPS + Deep Web + Crypto Wallet. Documento único (singleton) en Mongo — nunca hardcodeado,
 * para que Staff pueda ajustar la economía/dificultad sin tocar código.
 */
export interface RiskConfig {
  id: 'singleton';
  /** Deep Web: cuánto baja la exposición por hora sin sesión activa. */
  exposureDecayPerHour: number;
  /** Deep Web: probabilidad máxima (a 100% de exposición) de generar un incidente MDT. */
  maxDetectionChance: number;
  /** Deep Web: probabilidad de "sesión comprometida" sin VPS activo. */
  compromiseChanceUnprotected: number;
  /** Deep Web: probabilidad de "sesión comprometida" con VPS activo. */
  compromiseChanceProtected: number;
  /** Deep Web: fracción de las tenencias cripto que se pierden si la sesión es comprometida. */
  compromiseLossRate: number;
  /** Crypto Wallet: límite diario de envíos entre jugadores, en COP equivalentes. */
  dailySendLimitCOP: number;
  /** Crypto Wallet: fracción de la tenencia que, al enviarse de una vez, dispara la alerta "¿reconoces esta operación?". */
  unusualSendFraction: number;
  updatedAt: Date;
  updatedBy?: string;
}

export const DEFAULT_RISK_CONFIG: Omit<RiskConfig, 'id' | 'updatedAt' | 'updatedBy'> = {
  exposureDecayPerHour: 2.5,
  maxDetectionChance: 0.35,
  compromiseChanceUnprotected: 0.12,
  compromiseChanceProtected: 0.03,
  compromiseLossRate: 0.03,
  dailySendLimitCOP: 5_000_000,
  unusualSendFraction: 0.4,
};

export async function riskConfigCollection(): Promise<Collection<RiskConfig>> {
  const db = await connectToDatabase();
  const col = db.collection<RiskConfig>('risk_config');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

/** Lee la config real (o la crea con los valores por defecto si es la primera vez) — nunca hardcodeada en los llamadores. */
export async function getRiskConfig(): Promise<RiskConfig> {
  const col = await riskConfigCollection();
  const result = await col.findOneAndUpdate(
    { id: 'singleton' },
    { $setOnInsert: { id: 'singleton', ...DEFAULT_RISK_CONFIG, updatedAt: new Date(), updatedBy: 'Sistema' } },
    { upsert: true, returnDocument: 'after' }
  );
  return result!;
}

export async function updateRiskConfig(updates: Partial<Omit<RiskConfig, 'id' | 'updatedAt'>>, updatedBy: string): Promise<RiskConfig> {
  const col = await riskConfigCollection();
  await getRiskConfig();
  const result = await col.findOneAndUpdate(
    { id: 'singleton' },
    { $set: { ...updates, updatedAt: new Date(), updatedBy } },
    { returnDocument: 'after' }
  );
  return result!;
}

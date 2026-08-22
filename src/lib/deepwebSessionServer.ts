import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { resolvePlayerIdentity } from '@/lib/whitelistServer';
import { resolveVpsState } from '@/lib/vpsServer';
import { seizeCryptoFraction } from '@/lib/cryptoServer';
import { notifyUser } from '@/lib/notificationsServer';
import { mdtCallsCollection } from '@/lib/mdtServer';
import { getRiskConfig, type RiskConfig } from '@/lib/riskConfigServer';

/**
 * Todo lo relacionado con "seguridad", "detección", "exposición" y "protección" aquí es
 * exclusivamente una mecánica de juego (números en Mongo + roles server-side). No oculta
 * tráfico real, no evade sistemas policiales reales y no enseña técnicas reales de anonimización.
 */

export interface DeepWebPlayerState {
  discordId: string;
  exposure: number;
  sessionActive: boolean;
  sessionStartedAt?: Date;
  vpsProtected: boolean;
  securityLevel: number;
  updatedAt: Date;
}

export interface DeepWebRiskEvent {
  kind: 'detection' | 'compromised';
  message: string;
}

export function exposureTier(exposure: number): { id: 'low' | 'moderate' | 'high' | 'critical'; label: string } {
  if (exposure >= 76) return { id: 'critical', label: 'Crítico' };
  if (exposure >= 51) return { id: 'high', label: 'Alto' };
  if (exposure >= 21) return { id: 'moderate', label: 'Moderado' };
  return { id: 'low', label: 'Bajo' };
}

export async function deepWebStateCollection(): Promise<Collection<DeepWebPlayerState>> {
  const db = await connectToDatabase();
  const col = db.collection<DeepWebPlayerState>('deepweb_player_state');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

/**
 * Techo defensivo de una sesión "activa": si el jugador cierra la app/ventana sin pulsar "Salir"
 * (o la llamada DELETE al salir falla), la sesión quedaría marcada activa para siempre — el cliente
 * nunca reintenta cerrarla por su cuenta. Cualquier sesión más vieja que esto se trata como cerrada
 * la próxima vez que se lee, sin depender de que el cliente haya llamado a endDeepWebSession().
 */
const MAX_SESSION_DURATION_MS = 3 * 60 * 60 * 1000;

function applyDecay(state: DeepWebPlayerState, decayPerHour: number): DeepWebPlayerState {
  if (state.sessionActive) return state;
  const hours = (Date.now() - new Date(state.updatedAt).getTime()) / 3600000;
  if (hours <= 0) return state;
  const decayed = Math.max(0, state.exposure - hours * decayPerHour);
  if (decayed === state.exposure) return state;
  return { ...state, exposure: decayed };
}

function expireStaleSession(state: DeepWebPlayerState): DeepWebPlayerState {
  if (!state.sessionActive || !state.sessionStartedAt) return state;
  const elapsed = Date.now() - new Date(state.sessionStartedAt).getTime();
  if (elapsed < MAX_SESSION_DURATION_MS) return state;
  return { ...state, sessionActive: false, sessionStartedAt: undefined };
}

export async function getDeepWebState(discordId: string): Promise<DeepWebPlayerState> {
  const col = await deepWebStateCollection();
  const config = await getRiskConfig();
  // Upsert atómico: el hidratado de OSContext y el propio DeepWebApp llaman este GET casi a la vez
  // al montar, así que dos requests concurrentes no deben poder chocar en un E11000 duplicate key.
  const existing = await col.findOneAndUpdate(
    { discordId },
    { $setOnInsert: { discordId, exposure: 0, sessionActive: false, vpsProtected: false, securityLevel: 0, updatedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  );

  const expired = expireStaleSession(existing!);
  if (expired.sessionActive !== existing!.sessionActive) {
    await col.updateOne({ discordId }, { $set: { sessionActive: false, sessionStartedAt: undefined, updatedAt: new Date() } });
    return { ...expired, updatedAt: new Date() };
  }

  const decayed = applyDecay(expired, config.exposureDecayPerHour);
  if (decayed.exposure !== expired.exposure) {
    await col.updateOne({ discordId }, { $set: { exposure: decayed.exposure, updatedAt: new Date() } });
    return { ...decayed, updatedAt: new Date() };
  }
  return expired;
}

async function createCyberIncident(discordId: string, exposure: number, vpsProtected: boolean) {
  const identity = await resolvePlayerIdentity(discordId, { username: discordId });
  const col = await mdtCallsCollection();
  const count = await col.countDocuments();
  const now = new Date();
  const priority = exposure >= 76 ? 'Emergency' : exposure >= 51 ? 'High' : 'Medium';
  const doc = {
    id: crypto.randomUUID(),
    callNumber: String(5480 + count + 1),
    type: 'Cyber Crime' as const,
    priority: priority as 'Medium' | 'High' | 'Emergency',
    status: 'Pending' as const,
    location: 'Red Deep Web — origen no localizado con precisión',
    description: `Unidad de delitos informáticos reporta actividad sospechosa en la Deep Web asociada a ${identity.displayName}. Nivel de exposición detectado: ${Math.round(exposure)}%.${vpsProtected ? ' El sospechoso utilizaba un servicio de protección (VPS).' : ''}`,
    assignedUnits: [] as string[],
    createdAt: now,
    updatedAt: now,
    notes: [] as string[],
    title: `Actividad sospechosa en Deep Web — ${identity.displayName}`,
    suspects: [{ plate: '', name: identity.displayName }],
  };
  await col.insertOne(doc as any);
  return doc;
}

async function rollRiskEvent(discordId: string, exposure: number, vpsProtected: boolean, securityLevel: number, config: RiskConfig): Promise<DeepWebRiskEvent[]> {
  const events: DeepWebRiskEvent[] = [];

  const detectionChance = (exposure / 100) * config.maxDetectionChance * (vpsProtected ? Math.max(0.15, 1 - (securityLevel / 100) * 0.7) : 1);
  if (Math.random() < detectionChance) {
    await createCyberIncident(discordId, exposure, vpsProtected);
    await notifyUser(discordId, {
      title: 'Actividad sospechosa detectada',
      message: 'Podrías estar bajo vigilancia por autoridades. Tu exposición es alta — considera reducir tu actividad.',
      type: 'warning', appId: 'deepweb',
    });
    events.push({ kind: 'detection', message: 'Se detectó tu actividad. Podrías estar bajo investigación.' });
  }

  const compromiseChance = vpsProtected ? config.compromiseChanceProtected : config.compromiseChanceUnprotected;
  if (Math.random() < compromiseChance) {
    const seized = await seizeCryptoFraction(discordId, config.compromiseLossRate, 'Deep Web — sesión comprometida');
    await notifyUser(discordId, {
      title: 'Sesión comprometida',
      message: seized ? `Tu sesión fue comprometida. Perdiste ${seized.amount.toFixed(4)} ${seized.coinSymbol} de tu Crypto Wallet.` : 'Tu sesión fue comprometida y se cerró por seguridad.',
      type: 'error', appId: 'deepweb',
    });
    events.push({ kind: 'compromised', message: seized ? `Sesión comprometida — perdiste ${seized.amount.toFixed(4)} ${seized.coinSymbol}.` : 'Sesión comprometida — se cerró por seguridad.' });
  }

  return events;
}

export async function startDeepWebSession(discordId: string): Promise<{ state: DeepWebPlayerState; events: DeepWebRiskEvent[] }> {
  const state = await getDeepWebState(discordId);
  const col = await deepWebStateCollection();

  if (state.sessionActive) return { state, events: [] };

  const vpsSub = await resolveVpsState(discordId);
  const vpsProtected = vpsSub?.status === 'active';
  const securityLevel = vpsProtected ? vpsSub!.securityLevel : 0;

  const baseGain = vpsProtected ? 2 + Math.random() * 4 : 8 + Math.random() * 10;
  const gain = vpsProtected ? baseGain * (1 - securityLevel / 100) : baseGain;
  const exposure = Math.min(100, state.exposure + gain);

  const config = await getRiskConfig();
  const events = await rollRiskEvent(discordId, exposure, vpsProtected, securityLevel, config);
  const compromised = events.some((e) => e.kind === 'compromised');
  const exposureAfter = events.some((e) => e.kind === 'detection') ? Math.min(100, exposure + 5) : exposure;

  const now = new Date();
  const nextState: DeepWebPlayerState = {
    discordId, exposure: exposureAfter, sessionActive: !compromised,
    sessionStartedAt: compromised ? undefined : now, vpsProtected, securityLevel, updatedAt: now,
  };
  await col.updateOne({ discordId }, { $set: nextState }, { upsert: true });

  return { state: nextState, events };
}

export async function endDeepWebSession(discordId: string): Promise<DeepWebPlayerState> {
  const col = await deepWebStateCollection();
  const now = new Date();
  await col.updateOne({ discordId }, { $set: { sessionActive: false, sessionStartedAt: undefined, updatedAt: now } });
  const state = await col.findOne({ discordId });
  return state || { discordId, exposure: 0, sessionActive: false, vpsProtected: false, securityLevel: 0, updatedAt: now };
}

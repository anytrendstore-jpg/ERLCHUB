import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { Collection, Db } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { QUESTIONNAIRE_QUESTIONS, PHASE_ROUTES, type WhitelistPhase, type ApplicationStatus } from '@/lib/whitelistTypes';

export const SESSION_COOKIE = 'wl_session';
export const STAFF_COOKIE = 'wl_staff';
export const COLLECTION = 'whitelist_applications';

const SECRET = process.env.WHITELIST_SESSION_SECRET || 'erlchub-whitelist-dev-secret';

/** Servidor de Discord de ERLC HUB (para detectar si el usuario ya está dentro). */
export const ERLCHUB_GUILD_ID = process.env.DISCORD_SERVER_ID || '1142277873915400222';

/** El acceso a la whitelist es únicamente con Discord. */
export const DISCORD_CLIENT_ID =
  process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID || '';
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
export const discordConfigured = Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);

/**
 * Solo en desarrollo y solo si NO hay credenciales de Discord configuradas se
 * permite una entrada de prueba (para poder probar el flujo en local).
 */
export const devLoginAllowed = process.env.NODE_ENV !== 'production' && !discordConfigured;

/**
 * MODO BETA: permite saltar de una fase a otra de la whitelist para revisarlas
 * en detalle. Se activa con NEXT_PUBLIC_WHITELIST_BETA=1.
 */
export const betaMode = process.env.NEXT_PUBLIC_WHITELIST_BETA === '1';

/** Ids de Discord con acceso al panel de staff (separados por comas). */
export const STAFF_DISCORD_IDS = (process.env.STAFF_DISCORD_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/* ------------------------------------------------------------------ *
 * Documento de solicitud
 * ------------------------------------------------------------------ */

export interface WhitelistDiscord {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  /** 'oauth' = sesión real de Discord · 'dev' = entrada de prueba local */
  source: 'oauth' | 'dev';
  joinedServer: boolean;
  acceptedRules: boolean;
  connectedAt: Date;
}

export interface WhitelistRoblox {
  id?: string;
  username: string;
  displayName?: string;
  avatar?: string;
  verificationCode: string;
  verified: boolean;
  /** 'api' = código encontrado en la bio · 'offline' = sin conexión, aceptado en local · 'oauth' = confirmado con el login oficial de Roblox */
  verifiedMode?: 'api' | 'offline' | 'oauth';
  connectedAt?: Date;
}

export interface WhitelistAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export interface WhitelistCharacter {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  gender: string;
  height: string;
  nationality: string;
  group: string;
  city: string;
  photoUrl?: string;
}

export interface WhitelistDocument {
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  qrCode: string;
  securityCode: string;
  generatedAt: Date;
}

export interface WhitelistApplication {
  applicationId: string;
  discordId: string;
  fullName: string;
  email?: string;
  currentPhase: WhitelistPhase;
  status: ApplicationStatus;
  discord: WhitelistDiscord;
  roblox?: WhitelistRoblox;
  questionnaireDraft?: Record<string, string>;
  questionnaire?: WhitelistAnswer[];
  questionnaireScore?: number;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  staffNotes?: string;
  interviewRequested?: boolean;
  interviewRequestedAt?: Date;
  interviewRequestedBy?: string;
  interviewNotes?: string;
  character?: WhitelistCharacter;
  /** Borrador del personaje, autoguardado mientras el usuario llena el formulario del DNI (igual que questionnaireDraft). */
  characterDraft?: Record<string, string>;
  document?: WhitelistDocument;
  memberNumber?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function applications(): Promise<Collection<WhitelistApplication>> {
  const db: Db = await connectToDatabase();
  const col = db.collection<WhitelistApplication>(COLLECTION);
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ applicationId: 1 }, { unique: true }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Sesión (cookie httpOnly firmada)
 * ------------------------------------------------------------------ */

function sign(value: string) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex').slice(0, 32);
}

export function createSessionToken(applicationId: string) {
  return `${applicationId}.${sign(applicationId)}`;
}

export function readSessionToken(token?: string | null): string | null {
  if (!token) return null;
  const [applicationId, signature] = token.split('.');
  if (!applicationId || !signature) return null;
  const expected = sign(applicationId);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return applicationId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}

/** Devuelve la solicitud de la sesión actual, o null si no hay sesión válida. */
export async function currentApplication(): Promise<WhitelistApplication | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const applicationId = readSessionToken(token);
  if (!applicationId) return null;

  const col = await applications();
  return col.findOne({ applicationId });
}

/**
 * Identidad "de roleplay" para apps sociales (HubSocial/HubChat): el usuario (@handle)
 * es el usuario de Roblox verificado, y el nombre mostrado es el nombre del personaje.
 * Si el jugador todavía no verificó Roblox o no tiene personaje, cae de vuelta a Discord.
 */
export async function resolvePlayerIdentity(
  discordId: string,
  fallback: { username: string; avatar?: string }
): Promise<{ username: string; displayName: string; avatar?: string }> {
  const col = await applications();
  const app = await col.findOne({ discordId });

  const robloxUsername = app?.roblox?.verified ? app.roblox.username : undefined;
  const characterName = app?.character
    ? `${app.character.firstName} ${app.character.lastName}`.trim()
    : undefined;
  const robloxAvatar = app?.roblox?.verified ? app.roblox.avatar : undefined;

  return {
    username: robloxUsername || fallback.username,
    displayName: characterName || robloxUsername || fallback.username,
    avatar: robloxAvatar || fallback.avatar,
  };
}

/** Foto de perfil real del jugador — la de su Roblox verificado, no la de Discord, cuando ya vinculó uno en la whitelist. */
export async function verifiedRobloxAvatar(discordId: string): Promise<string | undefined> {
  const col = await applications();
  const app = await col.findOne({ discordId });
  return app?.roblox?.verified ? app.roblox.avatar : undefined;
}

export function isStaffSession() {
  const token = cookies().get(STAFF_COOKIE)?.value;
  if (readSessionToken(token) === 'staff') return true;
  return isStaffDiscordUser();
}

/** Lee la sesión de Discord del sitio (cookie `discord_session`). */
export function currentDiscordUser(): { id: string; username: string; avatar?: string; global_name?: string } | null {
  const raw = cookies().get('discord_session')?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(decodeURIComponent(raw));
    return session?.user?.id ? session.user : null;
  } catch {
    return null;
  }
}

/** ¿La persona que ha iniciado sesión con Discord está en la lista de staff? */
export function isStaffDiscordUser() {
  const user = currentDiscordUser();
  return Boolean(user && STAFF_DISCORD_IDS.includes(user.id));
}

/* ------------------------------------------------------------------ *
 * Alta / recuperación por cuenta de Discord
 * ------------------------------------------------------------------ */

export interface DiscordProfile {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  /** ¿Está ya dentro del servidor de ERLC HUB? (scope `guilds`) */
  inGuild?: boolean;
  source: 'oauth' | 'dev';
}

/**
 * Busca la solicitud de esa cuenta de Discord y la crea si no existe.
 * La cuenta de Discord ES la identidad: no hay email ni contraseña.
 */
export async function findOrCreateByDiscord(profile: DiscordProfile): Promise<WhitelistApplication> {
  const col = await applications();
  const now = new Date();
  const existing = await col.findOne({ discordId: profile.id });

  if (existing) {
    // Refrescamos los datos que pueden haber cambiado en Discord.
    const discord: WhitelistDiscord = {
      ...existing.discord,
      username: profile.username,
      globalName: profile.globalName || profile.username,
      avatar: profile.avatar,
      email: profile.email ?? existing.discord?.email,
      source: profile.source,
      joinedServer: existing.discord?.joinedServer || Boolean(profile.inGuild),
    };

    await col.updateOne(
      { discordId: profile.id },
      {
        $set: {
          discord,
          fullName: discord.globalName || discord.username,
          email: profile.email ?? existing.email,
          updatedAt: now,
        },
      }
    );

    return (await col.findOne({ discordId: profile.id }))!;
  }

  const application: WhitelistApplication = {
    applicationId: generateApplicationId(),
    discordId: profile.id,
    fullName: profile.globalName || profile.username,
    email: profile.email,
    currentPhase: 'discord',
    status: 'pending',
    discord: {
      id: profile.id,
      username: profile.username,
      globalName: profile.globalName || profile.username,
      avatar: profile.avatar,
      email: profile.email,
      source: profile.source,
      joinedServer: Boolean(profile.inGuild),
      acceptedRules: false,
      connectedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(application);
  return application;
}

/* ------------------------------------------------------------------ *
 * Utilidades del flujo
 * ------------------------------------------------------------------ */

export function generateApplicationId() {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `WL-${new Date().getFullYear()}-${random}`;
}

export function generateRobloxCode() {
  return `ERLC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generateDocumentNumber(prefix = 'CA') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(crypto.randomInt(chars.length));
  }
  return `${prefix}-${result}`;
}

/** Primer dígito del DNI según la ciudad del personaje. */
const CITY_DOCUMENT_PREFIX: Record<string, string> = {
  los_santos: '5',
  liberty_city: '7',
  vice_city: '8',
  las_venturas: '9',
};

/**
 * Genera el número de DNI del personaje: 1 dígito de ciudad + 8 dígitos
 * aleatorios = 9 dígitos en total como máximo, sin letras ni guiones.
 */
export function generateCityDocumentId(city: string): string {
  const prefix = CITY_DOCUMENT_PREFIX[city] || '5';
  let digits = '';
  for (let i = 0; i < 8; i++) {
    digits += crypto.randomInt(10).toString();
  }
  return prefix + digits;
}

/**
 * Puntúa el cuestionario de forma determinista: cada pregunta aporta lo mismo y
 * se valora que la respuesta cumpla el mínimo de longitud y aporte contenido
 * propio (palabras distintas), no que repita el enunciado.
 */
export function scoreQuestionnaire(answers: Record<string, string>): number {
  const perQuestion = 100 / QUESTIONNAIRE_QUESTIONS.length;
  let total = 0;

  for (const question of QUESTIONNAIRE_QUESTIONS) {
    const answer = (answers[question.id] || '').trim();
    if (!answer) continue;

    if (question.type === 'select' || question.type === 'radio') {
      total += question.options?.includes(answer) ? perQuestion : 0;
      continue;
    }

    const min = question.minLength || 50;
    const lengthRatio = Math.min(answer.length / min, 1);
    const words = answer.toLowerCase().split(/\s+/).filter(Boolean);
    const richness = Math.min(new Set(words).size / Math.max(words.length, 1), 1);

    total += perQuestion * (0.7 * lengthRatio + 0.3 * richness);
  }

  return Math.round(total);
}

/** Valida que el cuestionario cumpla los mínimos antes de aceptar el envío. */
export function validateQuestionnaire(answers: Record<string, string>): string | null {
  for (const question of QUESTIONNAIRE_QUESTIONS) {
    const answer = (answers[question.id] || '').trim();
    if (question.required && !answer) {
      return `Falta responder: "${question.question}"`;
    }
    if (question.minLength && answer.length < question.minLength) {
      return `La respuesta a "${question.question}" necesita al menos ${question.minLength} caracteres`;
    }
    if (question.maxLength && answer.length > question.maxLength) {
      return `La respuesta a "${question.question}" supera los ${question.maxLength} caracteres`;
    }
  }
  return null;
}

/** Ruta a la que debe ir el usuario según la fase en la que esté — fuente única en whitelistTypes.ts. */
export { PHASE_ROUTES };

/**
 * Asigna el próximo número de miembro de forma atómica (contador dedicado con
 * `$inc`), en vez de `countDocuments()+1` que puede repetirse si dos
 * solicitudes terminan al mismo tiempo.
 */
export async function nextMemberNumber(): Promise<number> {
  const db: Db = await connectToDatabase();
  const counters = db.collection<{ _id: string; seq: number }>('whitelist_counters');
  const result = await counters.findOneAndUpdate(
    { _id: 'memberNumber' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result?.seq ?? 1;
}

/** Versión de la solicitud que se envía al navegador. */
export function toPublicApplication(doc: WhitelistApplication) {
  const rest = { ...doc } as WhitelistApplication & { _id?: unknown };
  delete rest._id;
  return {
    ...rest,
    nextRoute: PHASE_ROUTES[doc.currentPhase],
  };
}

/* ------------------------------------------------------------------ *
 * Cliente de la API pública de ER:LC (Emergency Response: Liberty
 * County, vía Police Roleplay Community — api.policeroleplay.community).
 *
 * Da visibilidad real del servidor de Roblox: jugadores conectados
 * ahora mismo, cola, nombre del servidor. Es la única fuente de
 * "telemetría en vivo" de este proyecto — todo lo demás (miembros de
 * facciones, actividad, etc.) sigue siendo lo que el Staff registra
 * manualmente, porque no hay otro feed en tiempo real disponible.
 *
 * Requiere la variable de entorno ERLC_SERVER_API_KEY (Server-Key del
 * servidor privado). Nunca se hardcodea acá: si falta, las funciones
 * devuelven `ok:false` en vez de lanzar, para no tumbar el Dashboard.
 * ------------------------------------------------------------------ */

const BASE_URL = 'https://api.policeroleplay.community/v1';
const CACHE_TTL_MS = 20_000; // respeta el rate limit de la API sin dejar el Dashboard desactualizado

export interface ERLCServerStatus {
  Name: string;
  OwnerId: number;
  CoOwnerIds: number[];
  CurrentPlayers: number;
  MaxPlayers: number;
  JoinKey: string;
  AccVerifiedReq: string;
  TeamBalance: boolean;
}

export interface ERLCPlayer {
  Player: string; // "Nombre:UserId"
  Permission: string;
  Callsign?: string;
  Team: string;
}

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

const cache: { status?: { data: ERLCServerStatus; at: number }; players?: { data: ERLCPlayer[]; at: number } } = {};

export function isERLCConfigured(): boolean {
  return Boolean(process.env.ERLC_SERVER_API_KEY);
}

async function erlcFetch<T>(path: string): Promise<FetchResult<T>> {
  const key = process.env.ERLC_SERVER_API_KEY;
  if (!key) return { ok: false, error: 'ERLC_SERVER_API_KEY no está configurada' };

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Server-Key': key },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const message = res.status === 403 ? 'Server-Key inválida o servidor no encontrado' : `La API de ER:LC respondió ${res.status}`;
      return { ok: false, error: message };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo contactar la API de ER:LC' };
  }
}

export async function getERLCStatus(): Promise<FetchResult<ERLCServerStatus>> {
  if (cache.status && Date.now() - cache.status.at < CACHE_TTL_MS) {
    return { ok: true, data: cache.status.data };
  }
  const result = await erlcFetch<ERLCServerStatus>('/server');
  if (result.ok) cache.status = { data: result.data, at: Date.now() };
  return result;
}

export async function getERLCPlayers(): Promise<FetchResult<ERLCPlayer[]>> {
  if (cache.players && Date.now() - cache.players.at < CACHE_TTL_MS) {
    return { ok: true, data: cache.players.data };
  }
  const result = await erlcFetch<ERLCPlayer[]>('/server/players');
  if (result.ok) cache.players = { data: result.data, at: Date.now() };
  return result;
}

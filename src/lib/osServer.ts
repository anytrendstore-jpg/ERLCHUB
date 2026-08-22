import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, applications } from '@/lib/whitelistServer';
import { osApps } from '@/lib/osData';
import { currentActiveCharacterId } from '@/lib/characterServer';
import type { OSUserPreferences, OSModuleConfig } from '@/lib/osTypes';

/**
 * Quién está usando el Dashboard del Jugador ahora mismo — el personaje activo, no la cuenta
 * de Discord en bruto. Para el personaje principal ambos valores coinciden (su id de personaje
 * ES el discordId), así que ninguna cuenta que nunca cree un segundo personaje nota diferencia.
 */
export async function currentOSUserId(): Promise<string | null> {
  if (!currentDiscordUser()) return null;
  return currentActiveCharacterId();
}

/** Apps con las que arranca un usuario nuevo: el resto se instala desde Hub Store. */
export const ESSENTIAL_APP_IDS = ['hubstore', 'archivos', 'browser', 'settings', 'profile'];

export const CURRENT_TUTORIAL_VERSION = '1.0';

/** Todas las apps que hoy se pueden instalar (excluye las marcadas "Próximamente"). */
function allInstallableAppIds(): string[] {
  return osApps.filter((app) => !app.comingSoon).map((app) => app.id);
}

export const DEFAULT_OS_PREFERENCES: Omit<OSUserPreferences, 'discordId' | 'updatedAt'> = {
  wallpaper: { type: 'preset', value: 'default', fit: 'fill' },
  theme: {
    mode: 'dark',
    accent: '#3b82f6',
    taskbar: '#000000',
    startMenu: '#000000',
    windowBorder: '#ffffff',
    selection: '#3b82f6',
    transparency: 70,
    iconSize: 'medium',
    taskbarIconSize: 'medium',
  },
  savedThemes: [],
  installedApps: ESSENTIAL_APP_IDS,
  pinnedApps: ['hubstore'],
  onboarding: { completed: false },
};

export async function osUserPreferencesCollection(): Promise<Collection<OSUserPreferences>> {
  const db = await connectToDatabase();
  const col = db.collection<OSUserPreferences>('os_user_preferences');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

/**
 * Un jugador cuya whitelist ya está completada existía y usaba el servidor antes de que
 * existiera el sistema de instalación de Hub Store — no tiene sentido tratarlo como cuenta
 * nueva solo porque nunca llegó a guardar un fondo de pantalla (lo único que antes creaba
 * el documento de preferencias).
 */
async function isEstablishedPlayer(discordId: string): Promise<boolean> {
  const appsCol = await applications();
  const app = await appsCol.findOne({ discordId, currentPhase: 'completed' });
  return Boolean(app);
}

/**
 * Garantiza que exista un documento de preferencias real para este jugador.
 * - Si no existe y es un jugador ya establecido (whitelist completada): se "gradúa" con
 *   todas las apps instalables y el onboarding marcado como completado, para no quitarle
 *   apps a nadie que ya estuviera usando el sistema ni mostrarle el tutorial de nuevo.
 * - Si no existe y es realmente nuevo: arranca con el set esencial y onboarding pendiente.
 * - Si existe pero es de antes de esta función (sin installedApps): misma lógica de gradúo.
 */
export async function ensurePreferencesDoc(discordId: string): Promise<OSUserPreferences> {
  const col = await osUserPreferencesCollection();
  const existing = await col.findOne({ discordId });

  if (existing && existing.installedApps && existing.pinnedApps) {
    return existing;
  }

  if (!existing) {
    // Upsert atómico: si dos requests concurrentes de un usuario nuevo llegan a la vez
    // (preferencias + apps instaladas se piden en paralelo al cargar el escritorio),
    // esto evita el error de clave duplicada que un findOne+insertOne provocaría.
    const established = await isEstablishedPlayer(discordId);
    const seed = established
      ? { installedApps: allInstallableAppIds(), onboarding: { completed: true } }
      : { installedApps: DEFAULT_OS_PREFERENCES.installedApps, onboarding: DEFAULT_OS_PREFERENCES.onboarding };
    await col.updateOne(
      { discordId },
      {
        $setOnInsert: {
          discordId,
          wallpaper: DEFAULT_OS_PREFERENCES.wallpaper,
          theme: DEFAULT_OS_PREFERENCES.theme,
          savedThemes: DEFAULT_OS_PREFERENCES.savedThemes,
          pinnedApps: DEFAULT_OS_PREFERENCES.pinnedApps,
          ...seed,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } else {
    await col.updateOne(
      { discordId },
      {
        $set: {
          installedApps: existing.installedApps || allInstallableAppIds(),
          pinnedApps: existing.pinnedApps || DEFAULT_OS_PREFERENCES.pinnedApps,
          onboarding: existing.onboarding || { completed: true },
          updatedAt: new Date(),
        },
      }
    );
  }

  const fresh = await col.findOne({ discordId });
  return fresh as OSUserPreferences;
}

export async function osModulesConfigCollection(): Promise<Collection<OSModuleConfig>> {
  const db = await connectToDatabase();
  const col = db.collection<OSModuleConfig>('os_modules_config');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

/** Inserta en la colección los módulos de osApps que todavía no existan (sin tocar los ya configurados por Staff). */
export async function ensureOsModulesSeeded(): Promise<Collection<OSModuleConfig>> {
  const col = await osModulesConfigCollection();
  const existingIds = new Set((await col.find({}, { projection: { id: 1 } }).toArray()).map((d) => d.id));
  const missing = osApps.filter((app) => !existingIds.has(app.id));
  if (missing.length === 0) return col;

  const now = new Date();
  // Upsert por id (índice único ya existente): varios clientes pueden pollear /api/os/modules a la
  // vez justo después de un deploy que agrega una app nueva, así que esto no puede ser un insertMany.
  await Promise.all(missing.map((app) => col.updateOne(
    { id: app.id },
    { $setOnInsert: {
      id: app.id,
      enabled: !app.isLocked && !app.comingSoon,
      requiresStaff: app.requiresStaff,
      updatedAt: now,
      updatedBy: 'Sistema',
    } },
    { upsert: true }
  )));
  return col;
}

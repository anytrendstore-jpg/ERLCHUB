/* ------------------------------------------------------------------ *
 * Catálogo de permisos del motor RBAC del Panel Staff.
 *
 * Es la fuente de verdad de qué acciones EXISTEN en el sistema. Los
 * rangos (roles) no definen permisos libremente: solo pueden activar
 * o desactivar claves de esta lista. Añadir un permiso nuevo a un
 * módulo futuro es tan simple como agregar una entrada aquí.
 *
 * No están representados todos los micro-permisos mencionados en el
 * spec original para módulos ya estables (p. ej. cada acción de
 * "Jugadores" como players.vehicle.edit) — se cubrió el núcleo real
 * (ver/gestionar/sancionar) para no inventar decenas de permisos que
 * ningún endpoint todavía valida. Es fácil de ampliar cuando esos
 * módulos se migren a este motor.
 * ------------------------------------------------------------------ */

export type ScopeId =
  | 'global'
  | 'los_santos'
  | 'liberty_city'
  | 'vice_city'
  | 'las_venturas'
  | 'development'
  | 'community'
  | 'finance'
  | 'legal_factions'
  | 'illegal_factions';

export const SCOPES: { id: ScopeId; label: string }[] = [
  { id: 'global', label: 'Global (todo el servidor)' },
  { id: 'los_santos', label: 'Los Santos' },
  { id: 'liberty_city', label: 'Liberty City' },
  { id: 'vice_city', label: 'Vice City' },
  { id: 'las_venturas', label: 'Las Venturas' },
  { id: 'development', label: 'Desarrollo' },
  { id: 'community', label: 'Comunidad' },
  { id: 'finance', label: 'Finanzas' },
  { id: 'legal_factions', label: 'Facciones legales' },
  { id: 'illegal_factions', label: 'Facciones ilegales' },
];

export interface PermissionDef {
  key: string;
  module: string;
  label: string;
  /** Información sensible (economía, datos privados, asuntos internos...). Se resalta en la matriz. */
  sensitive?: boolean;
}

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  players: 'Jugadores',
  sanctions: 'Sanciones',
  reports: 'Reportes',
  logs: 'Logs',
  tickets: 'Tickets',
  whitelist: 'Whitelist',
  stats: 'Estadísticas',
  hubcareer: 'Corporativo / HubCareer',
  internal_affairs: 'Asuntos Internos',
  shift: 'Mi Turno',
  absences: 'Mis Ausencias',
  system_modules: 'Módulos del Sistema',
  development: 'Desarrollo',
  hubsocial: 'HubSocial',
  factions: 'Facciones Legales',
  gangs: 'Facciones Ilegales / Bandas',
  economy: 'Economía',
  staff: 'Staff / RRHH',
  permissions: 'Motor de Permisos',
};

export const PERMISSIONS: PermissionDef[] = [
  { key: 'dashboard.view', module: 'dashboard', label: 'Ver Dashboard' },
  { key: 'dashboard.announce', module: 'dashboard', label: 'Publicar comunicados de Dirección' },

  { key: 'players.view', module: 'players', label: 'Ver jugadores' },
  { key: 'players.search', module: 'players', label: 'Buscar jugadores' },
  { key: 'players.profile.view', module: 'players', label: 'Ver perfil completo' },
  { key: 'players.economy.view', module: 'players', label: 'Ver economía del jugador', sensitive: true },
  { key: 'players.economy.edit', module: 'players', label: 'Modificar economía del jugador', sensitive: true },
  { key: 'players.inventory.view', module: 'players', label: 'Ver inventario' },
  { key: 'players.inventory.edit', module: 'players', label: 'Modificar inventario' },
  { key: 'players.vehicles.view', module: 'players', label: 'Ver vehículos' },
  { key: 'players.properties.view', module: 'players', label: 'Ver propiedades' },
  { key: 'players.warn', module: 'players', label: 'Advertir jugador' },
  { key: 'players.kick', module: 'players', label: 'Expulsar jugador' },
  { key: 'players.ban', module: 'players', label: 'Banear jugador', sensitive: true },
  { key: 'players.unban', module: 'players', label: 'Desbanear jugador', sensitive: true },

  { key: 'sanctions.view', module: 'sanctions', label: 'Ver sanciones' },
  { key: 'sanctions.manage', module: 'sanctions', label: 'Aplicar / revocar sanciones' },

  { key: 'reports.view', module: 'reports', label: 'Ver reportes' },
  { key: 'reports.manage', module: 'reports', label: 'Gestionar reportes' },

  { key: 'logs.view', module: 'logs', label: 'Ver logs' },
  { key: 'logs.technical.view', module: 'logs', label: 'Ver logs técnicos', sensitive: true },

  { key: 'tickets.view', module: 'tickets', label: 'Ver tickets' },
  { key: 'tickets.manage', module: 'tickets', label: 'Gestionar tickets' },

  { key: 'whitelist.view', module: 'whitelist', label: 'Ver solicitudes de whitelist' },
  { key: 'whitelist.interview', module: 'whitelist', label: 'Realizar entrevistas' },
  { key: 'whitelist.manage', module: 'whitelist', label: 'Aprobar / rechazar solicitudes' },

  { key: 'stats.view', module: 'stats', label: 'Ver estadísticas' },

  { key: 'hubcareer.view', module: 'hubcareer', label: 'Ver HubCareer / empresas' },
  { key: 'hubcareer.manage', module: 'hubcareer', label: 'Administrar empresas y HubCareer' },

  { key: 'internal_affairs.view', module: 'internal_affairs', label: 'Ver Asuntos Internos', sensitive: true },
  { key: 'internal_affairs.manage', module: 'internal_affairs', label: 'Gestionar casos internos', sensitive: true },

  { key: 'shift.use', module: 'shift', label: 'Usar Mi Turno' },

  { key: 'absences.request', module: 'absences', label: 'Solicitar ausencia propia' },
  { key: 'absences.manage', module: 'absences', label: 'Aprobar / rechazar ausencias del Staff' },

  { key: 'system_modules.view', module: 'system_modules', label: 'Ver módulos del sistema' },
  { key: 'system_modules.manage', module: 'system_modules', label: 'Administrar módulos del sistema' },
  { key: 'dev.tools.access', module: 'development', label: 'Acceder a herramientas de desarrollo' },

  { key: 'hubsocial.view', module: 'hubsocial', label: 'Ver HubSocial' },
  { key: 'hubsocial.moderate', module: 'hubsocial', label: 'Moderar HubSocial' },

  { key: 'factions.view', module: 'factions', label: 'Ver facciones legales' },
  { key: 'factions.manage', module: 'factions', label: 'Administrar facciones legales' },
  { key: 'factions.audit.view', module: 'factions', label: 'Ver auditoría de facciones' },
  { key: 'factions.investigate', module: 'factions', label: 'Gestionar investigaciones' },

  { key: 'gangs.view', module: 'gangs', label: 'Ver bandas' },
  { key: 'gangs.manage', module: 'gangs', label: 'Administrar bandas y sanciones' },

  { key: 'economy.view', module: 'economy', label: 'Ver economía del servidor', sensitive: true },
  { key: 'economy.manage', module: 'economy', label: 'Administrar economía del servidor', sensitive: true },

  { key: 'staff.view', module: 'staff', label: 'Ver directorio de Staff' },
  { key: 'staff.hr.manage', module: 'staff', label: 'Gestionar personal (RRHH)', sensitive: true },
  { key: 'staff.training.manage', module: 'staff', label: 'Gestionar formación / entrevistas internas' },
  { key: 'staff.activity.review', module: 'staff', label: 'Supervisar actividad del Staff' },

  { key: 'permissions.manage', module: 'permissions', label: 'Administrar rangos, permisos y jerarquía', sensitive: true },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export function isValidPermissionKey(key: string): boolean {
  return PERMISSION_KEYS.includes(key);
}

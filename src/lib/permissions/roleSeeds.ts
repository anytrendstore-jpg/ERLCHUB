import type { ScopeId } from './catalog';

/* ------------------------------------------------------------------ *
 * Rangos por defecto del motor de permisos, tal como los define el
 * spec de jerarquía del Panel Staff. Se siembran una sola vez (si la
 * colección de rangos está vacía) y a partir de ahí el CEO es dueño
 * de la estructura: esta siembra NUNCA se vuelve a ejecutar sobre
 * datos existentes, así que renombrar/eliminar/tocar un rango desde
 * el Gestor de Permisos es seguro y no se revierte solo.
 *
 * `permissions: ['*']` es el único caso especial: significa "todos
 * los permisos, incluidos los que se agreguen después" — reservado
 * al CEO / Fundador (control absoluto, sección 9 del spec).
 * ------------------------------------------------------------------ */

export interface RoleSeed {
  key: string;
  name: string;
  category: string;
  hierarchy: number;
  scope: ScopeId;
  department?: string;
  permissions: string[];
  color: string;
}

const BASE_STAFF = ['dashboard.view', 'shift.use', 'absences.request'];

function territorialRoles(cityKey: string, cityLabel: string, scope: ScopeId, baseHierarchy: number): RoleSeed[] {
  return [
    {
      key: `${cityKey}_encargado`, name: `[${cityKey.toUpperCase()}] | Encargado`, category: cityLabel,
      hierarchy: baseHierarchy, scope, department: cityLabel, color: '#38bdf8',
      permissions: [...BASE_STAFF, 'staff.view', 'staff.activity.review', 'players.view', 'players.search', 'reports.view', 'reports.manage', 'tickets.view', 'tickets.manage'],
    },
    {
      key: `${cityKey}_subencargado`, name: `[${cityKey.toUpperCase()}] | SubEncargado`, category: cityLabel,
      hierarchy: baseHierarchy - 50, scope, department: cityLabel, color: '#38bdf8',
      permissions: [...BASE_STAFF, 'staff.view', 'players.view', 'players.search', 'reports.view', 'reports.manage', 'tickets.view', 'tickets.manage'],
    },
    {
      key: `${cityKey}_subgerente_operaciones`, name: `[${cityKey.toUpperCase()}] | SubGerente de Operaciones`, category: cityLabel,
      hierarchy: baseHierarchy - 100, scope, department: cityLabel, color: '#60a5fa',
      permissions: [...BASE_STAFF, 'staff.activity.review', 'reports.view', 'reports.manage', 'tickets.view', 'tickets.manage'],
    },
    {
      key: `${cityKey}_subgerente_comunidad`, name: `[${cityKey.toUpperCase()}] | SubGerente de Comunidad`, category: cityLabel,
      hierarchy: baseHierarchy - 100, scope, department: cityLabel, color: '#f472b6',
      permissions: [...BASE_STAFF, 'hubsocial.view', 'hubcareer.view', 'reports.view', 'tickets.view'],
    },
    {
      key: `${cityKey}_division`, name: `[${cityKey.toUpperCase()}] División`, category: cityLabel,
      hierarchy: baseHierarchy - 250, scope, department: cityLabel, color: '#94a3b8',
      permissions: [...BASE_STAFF, 'reports.view', 'tickets.view'],
    },
  ];
}

export const ROLE_SEEDS: RoleSeed[] = [
  /* -------- Nivel Ejecutivo -------- */
  { key: 'ceo_founder', name: '[CEO] | Fundador', category: 'Nivel Ejecutivo', hierarchy: 1000, scope: 'global', color: '#facc15', permissions: ['*'] },
  {
    key: 'coo', name: '[COO] | Director Operativo', category: 'Nivel Ejecutivo', hierarchy: 900, scope: 'global', color: '#f97316',
    permissions: [...BASE_STAFF, 'players.view', 'players.search', 'players.profile.view', 'reports.view', 'reports.manage', 'tickets.view', 'tickets.manage', 'staff.view', 'staff.activity.review', 'stats.view', 'factions.view', 'gangs.view', 'hubsocial.view', 'dashboard.announce'],
  },
  {
    key: 'cto', name: '[CTO] | Director Técnico', category: 'Nivel Ejecutivo', hierarchy: 900, scope: 'development', color: '#f97316',
    permissions: [...BASE_STAFF, 'system_modules.view', 'system_modules.manage', 'logs.technical.view', 'dev.tools.access', 'stats.view'],
  },
  {
    key: 'cfo', name: '[CFO] | Director Financiero', category: 'Nivel Ejecutivo', hierarchy: 900, scope: 'finance', color: '#f97316',
    permissions: [...BASE_STAFF, 'economy.view', 'economy.manage', 'players.economy.view', 'stats.view'],
  },
  {
    key: 'cmo', name: '[CMO] | Director Marketing', category: 'Nivel Ejecutivo', hierarchy: 900, scope: 'community', color: '#f97316',
    permissions: [...BASE_STAFF, 'hubsocial.view', 'hubsocial.moderate', 'hubcareer.view', 'hubcareer.manage', 'stats.view', 'dashboard.announce'],
  },
  {
    key: 'cfl', name: '[CFL] | Director Facciones Legales', category: 'Nivel Ejecutivo', hierarchy: 900, scope: 'legal_factions', color: '#f97316',
    permissions: [...BASE_STAFF, 'factions.view', 'factions.manage', 'factions.audit.view', 'factions.investigate', 'players.view'],
  },
  {
    key: 'cfi', name: '[CFI] | Director Facciones Ilegales', category: 'Nivel Ejecutivo', hierarchy: 900, scope: 'illegal_factions', color: '#f97316',
    permissions: [...BASE_STAFF, 'gangs.view', 'gangs.manage', 'factions.audit.view', 'players.view'],
  },

  /* -------- Gerencia Global -------- */
  {
    key: 'cg', name: '[CG] | Gerente General', category: 'Gerencia Global', hierarchy: 800, scope: 'global', color: '#a855f7',
    permissions: [...BASE_STAFF, 'staff.view', 'staff.activity.review', 'reports.view', 'reports.manage', 'tickets.view', 'tickets.manage', 'stats.view', 'players.view', 'dashboard.announce'],
  },
  {
    key: 'gd', name: '[GD] | Gerente de Desarrollo', category: 'Gerencia Global', hierarchy: 750, scope: 'development', color: '#a855f7',
    permissions: [...BASE_STAFF, 'system_modules.view', 'system_modules.manage', 'dev.tools.access', 'logs.technical.view'],
  },
  {
    key: 'go', name: '[GO] | Gerente de Operaciones', category: 'Gerencia Global', hierarchy: 750, scope: 'global', color: '#a855f7',
    permissions: [...BASE_STAFF, 'staff.view', 'staff.activity.review', 'reports.view', 'reports.manage', 'tickets.view', 'tickets.manage'],
  },
  {
    key: 'gc', name: '[GC] | Gerente de Comunidad', category: 'Gerencia Global', hierarchy: 750, scope: 'community', color: '#a855f7',
    permissions: [...BASE_STAFF, 'hubsocial.view', 'hubsocial.moderate', 'hubcareer.view', 'reports.view', 'tickets.view', 'dashboard.announce'],
  },

  /* -------- Facciones territoriales -------- */
  ...territorialRoles('ls', 'Los Santos', 'los_santos', 650),
  ...territorialRoles('lb', 'Liberty City', 'liberty_city', 650),
  ...territorialRoles('vc', 'Vice City', 'vice_city', 650),
  ...territorialRoles('lv', 'Las Venturas', 'las_venturas', 650),

  /* -------- Desarrollo -------- */
  {
    key: 'dev_principal', name: 'ERLCᴴᵁᴮ | Dev Principal', category: 'Desarrollo', hierarchy: 700, scope: 'development', color: '#22d3ee',
    permissions: [...BASE_STAFF, 'system_modules.view', 'system_modules.manage', 'dev.tools.access', 'logs.technical.view'],
  },
  {
    key: 'developer', name: 'ERLCᴴᵁᴮ | Desarrollador', category: 'Desarrollo', hierarchy: 500, scope: 'development', color: '#22d3ee',
    permissions: [...BASE_STAFF, 'system_modules.view', 'dev.tools.access', 'logs.technical.view'],
  },
  {
    key: 'tester_qa', name: 'ERLCᴴᵁᴮ | Tester QA', category: 'Desarrollo', hierarchy: 450, scope: 'development', color: '#22d3ee',
    permissions: [...BASE_STAFF, 'system_modules.view', 'dev.tools.access'],
  },
  { key: 'designer', name: 'ERLCᴴᵁᴮ | Diseñador', category: 'Desarrollo', hierarchy: 400, scope: 'development', color: '#22d3ee', permissions: [...BASE_STAFF] },
  { key: 'multimedia_editor', name: 'ERLCᴴᵁᴮ | Editor Multimedia', category: 'Desarrollo', hierarchy: 400, scope: 'community', color: '#22d3ee', permissions: [...BASE_STAFF] },

  /* -------- Staff Corporativo -------- */
  {
    key: 'sup_staff', name: 'ERLCᴴᵁᴮ | Sup. Staff', category: 'Staff Corporativo', hierarchy: 650, scope: 'global', color: '#34d399',
    permissions: [...BASE_STAFF, 'staff.view', 'staff.activity.review', 'tickets.view', 'reports.view'],
  },
  {
    key: 'trainer', name: 'ERLCᴴᵁᴮ | Entrenador', category: 'Staff Corporativo', hierarchy: 500, scope: 'global', color: '#34d399',
    permissions: [...BASE_STAFF, 'staff.training.manage', 'whitelist.interview'],
  },
  {
    key: 'activity_control', name: 'ERLCᴴᵁᴮ | Control Actividad', category: 'Staff Corporativo', hierarchy: 500, scope: 'global', color: '#34d399',
    permissions: [...BASE_STAFF, 'staff.activity.review', 'reports.view', 'tickets.view'],
  },
  {
    key: 'human_resources', name: 'ERLCᴴᵁᴮ | Recursos Humanos', category: 'Staff Corporativo', hierarchy: 550, scope: 'global', color: '#34d399',
    permissions: [...BASE_STAFF, 'staff.hr.manage', 'absences.manage', 'staff.view'],
  },

  /* -------- Staff ERLCHUB -------- */
  {
    key: 'general_support', name: 'ERLCᴴᵁᴮ | Soporte General', category: 'Staff ERLCHUB', hierarchy: 300, scope: 'global', color: '#94a3b8',
    permissions: [...BASE_STAFF, 'players.view', 'players.search', 'tickets.view', 'tickets.manage', 'reports.view'],
  },
  {
    key: 'interviewer', name: '[ERLCᴴᵁᴮ] | Entrevistadores', category: 'Staff ERLCHUB', hierarchy: 300, scope: 'global', color: '#94a3b8',
    permissions: [...BASE_STAFF, 'whitelist.view', 'whitelist.interview', 'whitelist.manage'],
  },
];

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { requireStaff, staffIdentity, type StaffIdentity } from '@/lib/staffServer';
import { ROLE_SEEDS, type RoleSeed } from './roleSeeds';
import { isValidPermissionKey, type ScopeId } from './catalog';

/* ------------------------------------------------------------------ *
 * Motor de permisos, rangos y jerarquía del Panel Staff.
 *
 * Capas de autorización de este proyecto (de afuera hacia adentro):
 *  1. requireStaff() / STAFF_DISCORD_IDS — ¿esta persona puede entrar
 *     al Panel Staff? (sin tocar, es la puerta de entrada existente)
 *  2. Este motor — dentro del panel, ¿qué puede ver/hacer exactamente?
 *
 * El login por contraseña ("Demo Staff") se trata como CEO para poder
 * probar el panel completo sin depender de asignar rangos primero —
 * mismo criterio que ya usa isDirector() en staffServer.ts.
 *
 * `STAFF_CEO_DISCORD_IDS` resuelve el problema del huevo y la gallina:
 * sin esto, nadie podría asignarse a sí mismo el rango de CEO desde el
 * Gestor de Permisos (esa acción ya exige permissions.manage). Mismo
 * patrón que STAFF_DIRECTOR_IDS en staffServer.ts.
 * ------------------------------------------------------------------ */

const STAFF_CEO_DISCORD_IDS = (process.env.STAFF_CEO_DISCORD_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

function isConfiguredCEO(identity: StaffIdentity | null): boolean {
  return Boolean(identity && identity.via === 'discord' && STAFF_CEO_DISCORD_IDS.includes(identity.id));
}

export interface StaffRole {
  id: string;
  key: string;
  name: string;
  category: string;
  hierarchy: number;
  scope: ScopeId;
  department?: string;
  permissions: string[]; // claves de PERMISSIONS, o ['*'] para control absoluto (CEO)
  color: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface StaffRoleAssignment {
  id: string;
  discordId: string;
  staffName: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: Date;
}

export interface StaffPermissionException {
  id: string;
  discordId: string;
  staffName: string;
  permissionKey: string;
  reason: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: string;
}

export async function staffRolesCollection(): Promise<Collection<StaffRole>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffRole>('staff_roles');
  await col.createIndex({ key: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function staffRoleAssignmentsCollection(): Promise<Collection<StaffRoleAssignment>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffRoleAssignment>('staff_role_assignments');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function staffPermissionExceptionsCollection(): Promise<Collection<StaffPermissionException>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffPermissionException>('staff_permission_exceptions');
  await col.createIndex({ discordId: 1 }).catch(() => {});
  return col;
}

/** Siembra los rangos por defecto UNA sola vez (colección vacía). Nunca pisa datos existentes. */
export async function ensureRolesSeeded(): Promise<void> {
  const col = await staffRolesCollection();
  const count = await col.estimatedDocumentCount();
  if (count > 0) return;
  const now = new Date();
  const docs: StaffRole[] = ROLE_SEEDS.map((seed: RoleSeed) => ({
    id: crypto.randomUUID(), key: seed.key, name: seed.name, category: seed.category,
    hierarchy: seed.hierarchy, scope: seed.scope, department: seed.department,
    permissions: seed.permissions, color: seed.color, createdAt: now, updatedAt: now,
  }));
  await col.insertMany(docs).catch(() => {});
}

export async function getRoleAssignment(discordId: string): Promise<StaffRoleAssignment | null> {
  const col = await staffRoleAssignmentsCollection();
  return col.findOne({ discordId });
}

export async function getAssignedRole(discordId: string): Promise<StaffRole | null> {
  const assignment = await getRoleAssignment(discordId);
  if (!assignment) return null;
  const rolesCol = await staffRolesCollection();
  return rolesCol.findOne({ id: assignment.roleId });
}

/** true si la identidad actual tiene control absoluto (CEO real, CEO configurado por env, o sesión demo). */
export async function isCEOUser(identity: StaffIdentity | null): Promise<boolean> {
  if (!identity) return false;
  if (identity.via === 'password' || isConfiguredCEO(identity)) return true;
  const role = await getAssignedRole(identity.id);
  return Boolean(role?.permissions.includes('*'));
}

/** Nivel jerárquico numérico de la identidad actual (CEO/demo = 1000). */
export async function getHierarchy(identity: StaffIdentity | null): Promise<number> {
  if (!identity) return 0;
  if (identity.via === 'password' || isConfiguredCEO(identity)) return 1000;
  const role = await getAssignedRole(identity.id);
  return role?.hierarchy ?? 0;
}

const CEO_HIERARCHY = 1000;

/** Un actor solo puede administrar a alguien de jerarquía estrictamente menor, salvo que sea CEO real. */
export function canManageHierarchy(actorHierarchy: number, targetHierarchy: number): boolean {
  if (actorHierarchy >= CEO_HIERARCHY) return true;
  return actorHierarchy > targetHierarchy;
}

/** Conjunto de permisos efectivos: rango asignado ∪ excepciones individuales vigentes (no expiradas/revocadas). */
export async function effectivePermissions(identity: StaffIdentity | null): Promise<{ all: boolean; keys: Set<string> }> {
  if (!identity) return { all: false, keys: new Set() };
  if (identity.via === 'password' || isConfiguredCEO(identity)) return { all: true, keys: new Set() };

  const role = await getAssignedRole(identity.id);
  if (role?.permissions.includes('*')) return { all: true, keys: new Set() };

  const keys = new Set(role?.permissions || []);
  const exCol = await staffPermissionExceptionsCollection();
  const now = new Date();
  const exceptions = await exCol.find({ discordId: identity.id, revokedAt: { $exists: false } }).toArray();
  for (const ex of exceptions) {
    if (ex.expiresAt && new Date(ex.expiresAt) < now) continue;
    keys.add(ex.permissionKey);
  }
  return { all: false, keys };
}

export async function hasPermission(identity: StaffIdentity | null, permissionKey: string): Promise<boolean> {
  const { all, keys } = await effectivePermissions(identity);
  return all || keys.has(permissionKey);
}

/** Guard de ruta: exige estar en el panel de Staff Y tener el permiso granular indicado. */
export async function requirePermission(permissionKey: string): Promise<NextResponse | null> {
  const staffDenied = requireStaff();
  if (staffDenied) return staffDenied;

  await ensureRolesSeeded();
  const identity = staffIdentity();
  const allowed = await hasPermission(identity, permissionKey);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'No tenés el permiso necesario para esta acción', requiredPermission: permissionKey },
      { status: 403 }
    );
  }
  return null;
}

/** Guard de ruta: solo control absoluto (CEO real o sesión demo). Para el propio motor de permisos. */
export async function requireCEO(): Promise<NextResponse | null> {
  return requirePermission('permissions.manage');
}

export { isValidPermissionKey };

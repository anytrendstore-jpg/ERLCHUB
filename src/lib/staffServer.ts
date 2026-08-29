import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, isStaffSession, STAFF_DISCORD_IDS } from '@/lib/whitelistServer';

/* ------------------------------------------------------------------ *
 * Auditoría de acciones del staff
 * ------------------------------------------------------------------ */

export type StaffActionType =
  | 'whitelist_approved'
  | 'whitelist_rejected'
  | 'whitelist_revision'
  | 'whitelist_in_review'
  | 'announcement_created'
  | 'announcement_deleted'
  | 'sanction_issued'
  | 'sanction_revoked'
  | 'report_resolved'
  | 'ticket_created'
  | 'ticket_closed'
  | 'economy_item_created'
  | 'economy_item_updated'
  | 'economy_item_deleted'
  | 'economy_tax_updated'
  | 'economy_config_updated'
  | 'treasury_adjusted'
  | 'treasury_distributed'
  | 'treasury_distribution_rate_updated'
  | 'department_budget_entry_recorded'
  | 'payroll_run_triggered'
  | 'os_module_toggled'
  | 'os_module_updated'
  | 'social_post_removed'
  | 'social_post_restored'
  | 'social_post_featured'
  | 'social_comment_removed'
  | 'social_report_resolved'
  | 'social_account_verified'
  | 'social_account_suspended'
  | 'social_account_type_changed'
  | 'social_account_bio_changed'
  | 'social_account_created'
  | 'social_page_created'
  | 'social_page_verified'
  | 'social_page_type_changed'
  | 'social_page_admin_added'
  | 'social_page_admin_removed'
  | 'social_page_details_changed'
  | 'hubpay_account_frozen'
  | 'hubpay_account_unfrozen'
  | 'loan_garnishment_released'
  | 'loan_config_updated'
  | 'inventory_item_transferred'
  | 'vps_plan_created'
  | 'vps_plan_updated'
  | 'crypto_coin_created'
  | 'crypto_coin_updated'
  | 'risk_config_updated'
  | 'hubcareer_verification_changed'
  | 'hubcareer_report_resolved'
  | 'hubcareer_company_status_changed'
  | 'hubcareer_company_edited'
  | 'absence_requested'
  | 'absence_reviewed'
  | 'internal_affairs_case_created'
  | 'internal_affairs_case_updated'
  | 'internal_affairs_accessed'
  | 'faction_created'
  | 'faction_updated'
  | 'faction_member_changed'
  | 'faction_rank_changed'
  | 'faction_transaction'
  | 'faction_investigation_created'
  | 'faction_investigation_updated'
  | 'gang_created'
  | 'gang_updated'
  | 'gang_sanction_issued'
  | 'gang_sanction_lifted'
  | 'gang_incident_logged'
  | 'permission_role_created'
  | 'permission_role_updated'
  | 'permission_role_deleted'
  | 'permission_role_assigned'
  | 'permission_role_unassigned'
  | 'permission_exception_granted'
  | 'permission_exception_revoked'
  | 'player_dossier_accessed'
  | 'character_slots_updated'
  | 'report_assigned'
  | 'report_escalated'
  | 'ticket_category_created'
  | 'ticket_category_deleted'
  | 'whitelist_interview_requested'
  | 'login';

export interface StaffAuditEntry {
  id: string;
  type: StaffActionType;
  /** Categoría que se pinta como etiqueta en la actividad reciente. */
  category: 'STAFF' | 'WL' | 'TICKET' | 'SANCION' | 'SYSTEM' | 'TIENDA' | 'ECONOMIA' | 'SOCIAL';
  actor: string;
  actorId?: string;
  target?: string;
  targetId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export async function staffAudit(): Promise<Collection<StaffAuditEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffAuditEntry>('staff_audit');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

/** Deja constancia de una acción del staff. Nunca lanza: no debe tumbar la acción real. */
export async function logStaffAction(entry: Omit<StaffAuditEntry, 'id' | 'createdAt'>) {
  try {
    const col = await staffAudit();
    await col.insertOne({
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('No se pudo registrar la acción de staff:', error);
  }
}

/* ------------------------------------------------------------------ *
 * Comunicados de dirección
 * ------------------------------------------------------------------ */

export interface StaffAnnouncement {
  id: string;
  title: string;
  body: string;
  scope: 'GLOBAL' | 'Los Santos' | 'Liberty City' | 'Las Venturas';
  pinned: boolean;
  author: string;
  authorId?: string;
  createdAt: Date;
}

export async function staffAnnouncements(): Promise<Collection<StaffAnnouncement>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffAnnouncement>('staff_announcements');
  await col.createIndex({ pinned: -1, createdAt: -1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Sesión de staff
 * ------------------------------------------------------------------ */

export interface StaffIdentity {
  id: string;
  name: string;
  avatar?: string;
  /** 'discord' = su cuenta está en la lista · 'password' = entró con la clave */
  via: 'discord' | 'password';
}

/** Quién está usando el panel ahora mismo (o null si no tiene acceso). */
export function staffIdentity(): StaffIdentity | null {
  const discordUser = currentDiscordUser();

  if (discordUser && STAFF_DISCORD_IDS.includes(discordUser.id)) {
    return {
      id: discordUser.id,
      name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
        : undefined,
      via: 'discord',
    };
  }

  if (isStaffSession()) {
    return { id: 'staff-local', name: 'Demo Staff', via: 'password' };
  }

  return null;
}

/** Bloquea la petición si quien la hace no tiene acceso al panel de staff. */
export function requireStaff(): NextResponse | null {
  if (!isStaffSession()) {
    return NextResponse.json({ success: false, error: 'Necesitas iniciar sesión como staff' }, { status: 401 });
  }
  return null;
}

/**
 * Ids de Discord con rol de Director (acceso al Menú de Economía y a las
 * decisiones económicas del servidor). Es un subconjunto de STAFF_DISCORD_IDS:
 * todo Director es staff, pero no todo staff es Director.
 */
export const STAFF_DIRECTOR_IDS = (process.env.STAFF_DIRECTOR_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/** El login por contraseña ("Demo Staff") cuenta como Director para poder probar el panel. */
export function isDirector(): boolean {
  const user = currentDiscordUser();
  if (user && STAFF_DIRECTOR_IDS.includes(user.id)) return true;
  if (isStaffSession() && !user) return true; // sesión por contraseña
  return false;
}

/** Bloquea la petición si quien la hace no tiene el rol de Director. */
export function requireDirector(): NextResponse | null {
  const staffDenied = requireStaff();
  if (staffDenied) return staffDenied;
  if (!isDirector()) {
    return NextResponse.json(
      { success: false, error: 'Esta sección requiere el rol de Director' },
      { status: 403 }
    );
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Sanciones
 * ------------------------------------------------------------------ */

export type SanctionType = 'warn' | 'kick' | 'temp_ban' | 'perm_ban' | 'restriction' | 'suspension';

export interface StaffSanction {
  id: string;
  type: SanctionType;
  targetName: string;
  targetDiscordId?: string;
  reason: string;
  durationHours?: number;
  issuedBy: string;
  issuedById?: string;
  active: boolean;
  createdAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
}

export async function staffSanctions(): Promise<Collection<StaffSanction>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffSanction>('staff_sanctions');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Reportes
 * ------------------------------------------------------------------ */

export type ReportStatus = 'open' | 'in_review' | 'assigned' | 'investigating' | 'resolved' | 'dismissed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface StaffReport {
  id: string;
  reporterName: string;
  /** Id de Discord de quien reporta, cuando viene del sitio (no de un registro manual del staff). */
  reporterId?: string;
  targetName: string;
  reason: string;
  details: string;
  status: ReportStatus;
  priority: ReportPriority;
  assignedTo?: string;
  assignedToId?: string;
  resolution?: string;
  handledBy?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export async function staffReports(): Promise<Collection<StaffReport>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffReport>('staff_reports');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Tickets de soporte
 * ------------------------------------------------------------------ */

export type TicketStatus = 'open' | 'in_progress' | 'closed';
/** Las categorías ya no son un union fijo: el staff las administra desde `ticketCategories()`. */
export type TicketCategory = string;
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TicketCategoryDoc {
  id: string;
  name: string;
  createdAt: Date;
}

const DEFAULT_TICKET_CATEGORIES = ['Soporte Técnico', 'Whitelist', 'Pagos', 'Reporte', 'Otro'];

export async function ticketCategories(): Promise<Collection<TicketCategoryDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<TicketCategoryDoc>('staff_ticket_categories');
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  const count = await col.estimatedDocumentCount();
  if (count === 0) {
    const now = new Date();
    await col.insertMany(DEFAULT_TICKET_CATEGORIES.map((name) => ({ id: crypto.randomUUID(), name, createdAt: now }))).catch(() => {});
  }
  return col;
}

export interface TicketAttachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
  kind: 'image' | 'video' | 'audio' | 'file';
}

export interface StaffTicketMessage {
  author: string;
  authorRole: 'staff' | 'user';
  body: string;
  createdAt: Date;
  attachments?: TicketAttachment[];
}

/** Nota privada del staff dentro de un ticket: el jugador nunca la ve. */
export interface StaffTicketNote {
  author: string;
  body: string;
  createdAt: Date;
}

export interface StaffTicket {
  id: string;
  /** Número corto y secuencial para mostrar ("#3") — el id real es el UUID. */
  ticketNumber: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  playerName: string;
  /** Id de Discord del jugador que abrió el ticket (para que solo él vea/responda su propio ticket). */
  playerId?: string;
  status: TicketStatus;
  assignedTo?: string;
  messages: StaffTicketMessage[];
  internalNotes: StaffTicketNote[];
  /** Quién escribió el último mensaje visible: sirve para marcar "sin leer" en la lista del staff. */
  lastMessageFrom: 'user' | 'staff';
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export async function staffTickets(): Promise<Collection<StaffTicket>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffTicket>('staff_tickets');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

/** Siguiente número de ticket correlativo (para mostrar "#N" en vez del UUID). */
export async function nextTicketNumber(col: Collection<StaffTicket>): Promise<number> {
  const last = await col.find({}).sort({ ticketNumber: -1 }).limit(1).toArray();
  return (last[0]?.ticketNumber || 0) + 1;
}

/* ------------------------------------------------------------------ *
 * Turnos (Mi Turno)
 * ------------------------------------------------------------------ */

export interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  clockIn: Date;
  clockOut?: Date;
  notes?: string;
}

export async function staffShifts(): Promise<Collection<StaffShift>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffShift>('staff_shifts');
  await col.createIndex({ staffId: 1, clockIn: -1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Ausencias (Mis Ausencias)
 * ------------------------------------------------------------------ */

export type AbsenceType = 'vacation' | 'permission' | 'sick';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export interface StaffAbsence {
  id: string;
  staffId: string;
  staffName: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason: string;
  status: AbsenceStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

export async function staffAbsences(): Promise<Collection<StaffAbsence>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffAbsence>('staff_absences');
  await col.createIndex({ staffId: 1, createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Directorio de staff (solo informativo; el acceso real lo da
 * STAFF_DISCORD_IDS en el entorno)
 * ------------------------------------------------------------------ */

export interface StaffMember {
  id: string;
  discordId: string;
  name: string;
  role: string;
  addedAt: Date;
  addedBy: string;
  /** Número de staff secuencial (#001, #002...), asignado una sola vez al ingresar al directorio. */
  staffNumber?: number;
}

export async function staffMembers(): Promise<Collection<StaffMember>> {
  const db = await connectToDatabase();
  const col = db.collection<StaffMember>('staff_members');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

/**
 * Asigna el próximo número de staff de forma atómica — mismo patrón y misma
 * colección de contadores (`whitelist_counters`) que ya usa nextMemberNumber()
 * para la whitelist, solo con otra clave (`staffNumber`).
 */
export async function nextStaffNumber(): Promise<number> {
  const db = await connectToDatabase();
  const counters = db.collection<{ _id: string; seq: number }>('whitelist_counters');
  const result = await counters.findOneAndUpdate(
    { _id: 'staffNumber' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result?.seq ?? 1;
}

/* ------------------------------------------------------------------ *
 * Menú de Economía
 * ------------------------------------------------------------------ */

/** Módulos que comparten el mismo registro genérico (catálogo tipo lista). */
export type EconomyModule =
  | 'catalog'    // Tienda: artículos, membresías, kits
  | 'jobs'       // Sueldos: trabajos legales
  | 'casino'     // Casino: juegos de azar
  | 'companies'  // Empresas
  | 'vehicles'   // Concesionario
  | 'weapons'    // Tienda de armas
  | 'market'     // Mercado entre jugadores: incidentes registrados manualmente
  | 'illegal';   // Subsistemas ilegales: ingresos por facción registrados manualmente

export interface EconomyItem {
  id: string;
  module: EconomyModule;
  name: string;
  /** Campos propios de cada módulo (precio, salario, RTP, stock...), como pares clave/valor. */
  fields: Record<string, string | number | boolean>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export async function economyItems(): Promise<Collection<EconomyItem>> {
  const db = await connectToDatabase();
  const col = db.collection<EconomyItem>('economy_items');
  await col.createIndex({ module: 1, createdAt: -1 }).catch(() => {});
  return col;
}

/** Un porcentaje de impuesto por categoría económica. */
export interface EconomyTaxRate {
  category: 'tienda' | 'trabajos' | 'ilegal' | 'transferencias' | 'empresas' | 'marketplace' | 'property' | 'vehicle';
  percentage: number;
  updatedAt: Date;
  updatedBy: string;
}

export const TAX_CATEGORIES: { id: EconomyTaxRate['category']; label: string }[] = [
  { id: 'tienda', label: 'Compras en tienda' },
  { id: 'trabajos', label: 'Ingresos de trabajos' },
  { id: 'ilegal', label: 'Actividades ilegales' },
  { id: 'transferencias', label: 'Transferencias entre jugadores' },
  { id: 'empresas', label: 'Operaciones empresariales' },
  { id: 'marketplace', label: 'Comisión de MercadoLibre' },
  { id: 'property', label: 'Property Tax (propiedades)' },
  { id: 'vehicle', label: 'Vehicle Registration Tax' },
];

export async function economyTaxRates(): Promise<Collection<EconomyTaxRate>> {
  const db = await connectToDatabase();
  const col = db.collection<EconomyTaxRate>('economy_tax_rates');
  await col.createIndex({ category: 1 }, { unique: true }).catch(() => {});
  return col;
}

/** Tiempo relativo en español para la actividad reciente ("Hace 5 min"). */
export function relativeTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - value.getTime()) / 1000);

  if (seconds < 60) return 'Ahora mismo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} d`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
}

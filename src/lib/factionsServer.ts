import crypto from 'crypto';
import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/* ------------------------------------------------------------------ *
 * Facciones legales (Policía, Bomberos, EMS, DOT, DOJ, FBI, DEA, ...)
 * Administración real: rangos, miembros, finanzas. Sin telemetría en
 * vivo del servidor de juego (no existe ese feed en este proyecto):
 * los conteos "conectados/en servicio" salen de lo que el staff
 * registra, nunca de datos inventados.
 * ------------------------------------------------------------------ */

export type FactionStatus = 'operational' | 'reduced' | 'review' | 'suspended' | 'inactive';

export interface FactionRank {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  salary: number;
}

export interface FactionMemberEntry {
  playerId?: string;
  playerName: string;
  rankId: string;
  status: 'active' | 'inactive';
  joinedAt: Date;
}

export interface LegalFaction {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  status: FactionStatus;
  directorId?: string;
  directorName?: string;
  subdirectorId?: string;
  subdirectorName?: string;
  ranks: FactionRank[];
  members: FactionMemberEntry[];
  budget: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export async function legalFactionsCollection(): Promise<Collection<LegalFaction>> {
  const db = await connectToDatabase();
  const col = db.collection<LegalFaction>('legal_factions');
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

/**
 * Gate real para las terminales institucionales: ¿este Discord ID es miembro
 * activo de la facción con esta abreviación? (no depende del perfil de
 * oficial del MDT, que se auto-crea para cualquier usuario logueado).
 */
export async function checkFactionAccess(discordId: string, abbreviation: string): Promise<{
  allowed: boolean;
  faction: LegalFaction | null;
  rank: FactionRank | null;
}> {
  const col = await legalFactionsCollection();
  const faction = await col.findOne({ abbreviation });
  if (!faction) return { allowed: false, faction: null, rank: null };

  const member = faction.members.find((m) => m.playerId === discordId && m.status === 'active');
  if (!member) return { allowed: false, faction, rank: null };

  const rank = faction.ranks.find((r) => r.id === member.rankId) || null;
  return { allowed: true, faction, rank };
}

/**
 * Busca la propia membresía + rango de una cuenta dentro de una facción —
 * lo que la terminal institucional usa para decidir "alto mando" (a
 * diferencia de checkFactionAccess, no exige status activo por sí sola:
 * el llamador decide qué hacer con una membresía inactiva).
 */
export function findOwnMembership(faction: LegalFaction, discordId: string): { member: FactionMemberEntry | null; rank: FactionRank | null } {
  const member = faction.members.find((m) => m.playerId === discordId) || null;
  const rank = member ? faction.ranks.find((r) => r.id === member.rankId) || null : null;
  return { member, rank };
}

/* ------------------------------------------------------------------ *
 * Mutaciones de facción — un solo lugar con la regla de negocio,
 * llamado tanto por /api/staff/factions (gate: permiso de Staff) como
 * por /api/terminal/[dept]/faction (gate: alto mando real de esa
 * facción). Cada función valida sus propios datos y registra auditoría
 * de facción; NO hace logStaffAction (eso queda a cargo del caller,
 * solo cuando el actor es Staff).
 * ------------------------------------------------------------------ */

export type FactionMutationResult = { success: true } | { success: false; error: string; status: number };

export async function addFactionMember(
  faction: LegalFaction,
  body: { playerId?: string; playerName?: string; rankId?: string },
  actor: { id?: string; name: string }
): Promise<FactionMutationResult> {
  if (!body.playerName?.trim() || !body.rankId) return { success: false, error: 'Faltan datos del miembro', status: 400 };
  if (!faction.ranks.some((r) => r.id === body.rankId)) return { success: false, error: 'Rango inválido', status: 400 };
  const col = await legalFactionsCollection();
  const now = new Date();
  await col.updateOne(
    { id: faction.id },
    { $push: { members: { playerId: body.playerId, playerName: body.playerName.trim(), rankId: body.rankId, status: 'active', joinedAt: now } } as any, $set: { updatedAt: now } }
  );
  await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'member_added', actorId: actor.id, actorName: actor.name, targetName: body.playerName.trim() });
  return { success: true };
}

export async function removeFactionMember(
  faction: LegalFaction,
  body: { playerName?: string },
  actor: { id?: string; name: string }
): Promise<FactionMutationResult> {
  if (!body.playerName?.trim()) return { success: false, error: 'Falta el miembro', status: 400 };
  const col = await legalFactionsCollection();
  const now = new Date();
  await col.updateOne({ id: faction.id }, { $pull: { members: { playerName: body.playerName } } as any, $set: { updatedAt: now } });
  await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'member_removed', actorId: actor.id, actorName: actor.name, targetName: body.playerName });
  return { success: true };
}

export async function changeFactionMemberRank(
  faction: LegalFaction,
  body: { playerName?: string; rankId?: string },
  actor: { id?: string; name: string }
): Promise<FactionMutationResult> {
  if (!body.playerName?.trim() || !body.rankId) return { success: false, error: 'Faltan datos', status: 400 };
  if (!faction.ranks.some((r) => r.id === body.rankId)) return { success: false, error: 'Rango inválido', status: 400 };
  const col = await legalFactionsCollection();
  const now = new Date();
  const prevMember = faction.members.find((m) => m.playerName === body.playerName);
  await col.updateOne({ id: faction.id, 'members.playerName': body.playerName }, { $set: { 'members.$.rankId': body.rankId, updatedAt: now } });
  const prevRank = faction.ranks.find((r) => r.id === prevMember?.rankId)?.name;
  const newRank = faction.ranks.find((r) => r.id === body.rankId)?.name;
  await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'rank_assigned', actorId: actor.id, actorName: actor.name, targetName: body.playerName, previousValue: prevRank, newValue: newRank });
  return { success: true };
}

export async function addFactionRank(
  faction: LegalFaction,
  body: { name?: string; level?: number; permissions?: string[]; salary?: number },
  actor: { id?: string; name: string }
): Promise<FactionMutationResult> {
  if (!body.name?.trim()) return { success: false, error: 'Falta el nombre del rango', status: 400 };
  const col = await legalFactionsCollection();
  const now = new Date();
  const rank: FactionRank = {
    id: crypto.randomUUID(), name: body.name.trim(), level: Number(body.level) || faction.ranks.length + 1,
    permissions: Array.isArray(body.permissions) ? body.permissions : [], salary: Number(body.salary) || 0,
  };
  await col.updateOne({ id: faction.id }, { $push: { ranks: rank } as any, $set: { updatedAt: now } });
  await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'rank_created', actorId: actor.id, actorName: actor.name, newValue: rank.name });
  return { success: true };
}

export async function updateFactionRank(
  faction: LegalFaction,
  body: { rankId?: string; name?: string; level?: number; salary?: number; permissions?: string[] },
  actor: { id?: string; name: string }
): Promise<FactionMutationResult> {
  if (!body.rankId) return { success: false, error: 'Falta el rango', status: 400 };
  const col = await legalFactionsCollection();
  const now = new Date();
  const updates: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) updates['ranks.$.name'] = body.name.trim();
  if (typeof body.level === 'number') updates['ranks.$.level'] = body.level;
  if (typeof body.salary === 'number') updates['ranks.$.salary'] = body.salary;
  if (Array.isArray(body.permissions)) updates['ranks.$.permissions'] = body.permissions;
  await col.updateOne({ id: faction.id, 'ranks.id': body.rankId }, { $set: { ...updates, updatedAt: now } });
  await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'rank_updated', actorId: actor.id, actorName: actor.name });
  return { success: true };
}

export async function deleteFactionRank(
  faction: LegalFaction,
  body: { rankId?: string },
  actor: { id?: string; name: string }
): Promise<FactionMutationResult> {
  if (!body.rankId) return { success: false, error: 'Falta el rango', status: 400 };
  if (faction.members.some((m) => m.rankId === body.rankId)) return { success: false, error: 'Hay miembros con ese rango; reasígnalos primero', status: 400 };
  const col = await legalFactionsCollection();
  const now = new Date();
  await col.updateOne({ id: faction.id }, { $pull: { ranks: { id: body.rankId } } as any, $set: { updatedAt: now } });
  await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'rank_deleted', actorId: actor.id, actorName: actor.name });
  return { success: true };
}

export function defaultRanks(): FactionRank[] {
  return [
    { id: crypto.randomUUID(), name: 'Cadete', level: 1, permissions: [], salary: 0 },
    { id: crypto.randomUUID(), name: 'Oficial', level: 2, permissions: [], salary: 0 },
    { id: crypto.randomUUID(), name: 'Sargento', level: 3, permissions: [], salary: 0 },
    { id: crypto.randomUUID(), name: 'Teniente', level: 4, permissions: [], salary: 0 },
    { id: crypto.randomUUID(), name: 'Capitán', level: 5, permissions: [], salary: 0 },
  ];
}

/* ------------------------------------------------------------------ *
 * Finanzas de facción
 * ------------------------------------------------------------------ */

export type FactionTransactionType = 'income' | 'expense' | 'salary' | 'purchase' | 'transfer';

export interface FactionTransaction {
  id: string;
  factionId: string;
  factionName: string;
  type: FactionTransactionType;
  amount: number;
  responsible: string;
  reason: string;
  createdAt: Date;
}

export async function factionTransactionsCollection(): Promise<Collection<FactionTransaction>> {
  const db = await connectToDatabase();
  const col = db.collection<FactionTransaction>('faction_transactions');
  await col.createIndex({ factionId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Auditoría de facciones — detecta patrones anómalos por umbral simple
 * (no es Machine Learning: cuenta acciones repetidas del mismo actor
 * sobre la misma facción en la última hora, como pide el spec).
 * ------------------------------------------------------------------ */

export type FactionAuditAction =
  | 'faction_created' | 'faction_updated' | 'status_changed' | 'director_changed'
  | 'member_added' | 'member_removed' | 'rank_assigned'
  | 'rank_created' | 'rank_updated' | 'rank_deleted' | 'transaction';

export type FactionAuditSeverity = 'normal' | 'warning' | 'suspicious' | 'critical';

export interface FactionAuditEntry {
  id: string;
  factionId: string;
  factionName: string;
  action: FactionAuditAction;
  actorId?: string;
  actorName: string;
  targetName?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  severity: FactionAuditSeverity;
  createdAt: Date;
}

export async function factionAuditCollection(): Promise<Collection<FactionAuditEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<FactionAuditEntry>('faction_audit_log');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ factionId: 1 }).catch(() => {});
  return col;
}

const ANOMALY_ACTIONS: FactionAuditAction[] = ['member_added', 'member_removed', 'rank_assigned', 'transaction'];

/** Registra una entrada de auditoría y calcula su severidad por umbral de repetición. */
export async function recordFactionAudit(entry: Omit<FactionAuditEntry, 'id' | 'createdAt' | 'severity'>): Promise<FactionAuditSeverity> {
  const col = await factionAuditCollection();
  let severity: FactionAuditSeverity = 'normal';

  if (ANOMALY_ACTIONS.includes(entry.action)) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await col.countDocuments({
      factionId: entry.factionId, action: entry.action, actorId: entry.actorId, createdAt: { $gte: since },
    });
    if (recentCount >= 10) severity = 'critical';
    else if (recentCount >= 5) severity = 'suspicious';
    else if (recentCount >= 3) severity = 'warning';
  }

  await col.insertOne({ ...entry, id: crypto.randomUUID(), severity, createdAt: new Date() });
  return severity;
}

/* ------------------------------------------------------------------ *
 * Investigaciones sobre facciones (desde Auditoría)
 * ------------------------------------------------------------------ */

export type FactionInvestigationStatus = 'open' | 'investigating' | 'review' | 'resolved' | 'archived';

export interface FactionInvestigation {
  id: string;
  factionId: string;
  factionName: string;
  involvedNames: string[];
  reason: string;
  evidence: { id: string; text: string; addedBy: string; addedAt: Date }[];
  investigatorName?: string;
  status: FactionInvestigationStatus;
  resolution?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function factionInvestigationsCollection(): Promise<Collection<FactionInvestigation>> {
  const db = await connectToDatabase();
  const col = db.collection<FactionInvestigation>('faction_investigations');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

/* ------------------------------------------------------------------ *
 * Bandas / organizaciones ilegales — "Sanciones Bandas"
 * ------------------------------------------------------------------ */

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type GangStatus = 'active' | 'suspended' | 'disbanded';

export interface GangMemberEntry {
  playerId?: string;
  playerName: string;
  joinedAt: Date;
}

export interface Gang {
  id: string;
  name: string;
  leaderName?: string;
  subleaderName?: string;
  members: GangMemberEntry[];
  status: GangStatus;
  threatLevel: ThreatLevel;
  territory?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export async function gangsCollection(): Promise<Collection<Gang>> {
  const db = await connectToDatabase();
  const col = db.collection<Gang>('gangs');
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

export type GangSanctionType = 'warning' | 'fine' | 'restriction' | 'suspension' | 'disband';

export interface GangSanction {
  id: string;
  gangId: string;
  gangName: string;
  type: GangSanctionType;
  reason: string;
  durationHours?: number;
  staffResponsible: string;
  evidence: string[];
  status: 'active' | 'lifted';
  createdAt: Date;
  liftedAt?: Date;
  liftedBy?: string;
}

export async function gangSanctionsCollection(): Promise<Collection<GangSanction>> {
  const db = await connectToDatabase();
  const col = db.collection<GangSanction>('gang_sanctions');
  await col.createIndex({ gangId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export interface GangIncident {
  id: string;
  gangId: string;
  gangName: string;
  location?: string;
  involvedNames: string[];
  type: string;
  evidence: string[];
  status: 'open' | 'closed';
  createdAt: Date;
}

export async function gangIncidentsCollection(): Promise<Collection<GangIncident>> {
  const db = await connectToDatabase();
  const col = db.collection<GangIncident>('gang_incidents');
  await col.createIndex({ gangId: 1, createdAt: -1 }).catch(() => {});
  return col;
}
